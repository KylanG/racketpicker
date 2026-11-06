/**
 * New products from bol (RP-77). Pure part: which search results become a product, and
 * brand, model and year from the bol title. The I/O lives in bol-discovery-run.ts.
 */
import type { CategoryKey, SportKey } from "@/lib/catalog/taxonomy";
import { validGtin } from "./bol";

export type ProductType = "balls" | "grips" | "bags";

export type DiscoveryTarget = {
  key: string;
  searchTerm: string;
  category: CategoryKey;
  sport: SportKey;
  productType: ProductType | null;
  /** How many popular results to look at (pages of 50). */
  limit: number;
  /** Title must match … */
  include: RegExp;
  /** … and must not match. */
  exclude: RegExp;
  minPrice: number;
};

/** Things that are never the product itself: covers, kids' sizes, beach tennis, sets. */
const NOT_A_RACKET =
  /\b(hoes|cover|tas|bag|rugzak|bal(len)?|grip|overgrip|protector|beschermer|tape|set|kinder|kids?|junior|jr|beach|strand|tennisracket|pickleball|squash|badminton|sleutelhanger|mini)\b/i;

/** Clothing and shoes, which brand searches bring up next to rackets. */
const NOT_GEAR =
  /\b(schoen(en)?|shoes?|sneakers?|shirt|t-shirt|polo|shorts?|broek|rok|jurk|skort|jas|jack|hoodie|sweater|vest|sokken|socks|pet|cap|hoofdband|polsband|zweetband)\b/i;

const BASE_TARGETS: DiscoveryTarget[] = [
  {
    key: "padel-rackets",
    searchTerm: "padel racket",
    category: "rackets",
    sport: "padel",
    productType: null,
    limit: 100,
    include: /padel/i,
    exclude: NOT_A_RACKET,
    minPrice: 40,
  },
  {
    key: "padel-balls",
    searchTerm: "padelballen",
    category: "accessories",
    sport: "padel",
    productType: "balls",
    limit: 60,
    include: /padel.*\bbal(len)?\b|\bbal(len)?\b.*padel|padelbal/i,
    exclude: /\b(racket|tas|bag|machine|kanon|houder|mand)\b/i,
    minPrice: 3,
  },
  {
    key: "padel-grips",
    searchTerm: "padel overgrip",
    category: "accessories",
    sport: "padel",
    productType: "grips",
    limit: 60,
    include: /grip/i,
    exclude: /\b(racket|tas|bag|bal(len)?|fiets|golf|handschoen)\b/i,
    minPrice: 3,
  },
  {
    key: "padel-bags",
    searchTerm: "padeltas",
    category: "accessories",
    sport: "padel",
    productType: "bags",
    limit: 60,
    include: /padel.*\b(tas|bag|rugzak|backpack|racketbag|thermobag)\b|padeltas/i,
    exclude: /\b(racket(?!bag)|bal(len)?|grip|hoes|cover)\b/i,
    minPrice: 15,
  },
];

/**
 * Padel brands we accept, in the spelling we show. Results of other brands are skipped,
 * which keeps generic or no-name products off the site.
 */
export const KNOWN_BRANDS = [
  "Adidas",
  "Babolat",
  "Black Crown",
  "Bullpadel",
  "Drop Shot",
  "Dunlop",
  "Head",
  "Joma",
  "Kuikma",
  "Lok",
  "Nox",
  "Oxdog",
  "Prince",
  "Puma",
  "Royal Padel",
  "Siux",
  "Softee",
  "StarVie",
  "Tecnifibre",
  "Varlion",
  "Vibor-A",
  "Wilson",
] as const;

/**
 * One extra racket search per brand (RP-81): the general search only reaches the most
 * popular models. These run after the general ones, so popular products come in first.
 * The title must name a racket, and clothing or shoes are skipped.
 */
const BRAND_RACKET_TARGETS: DiscoveryTarget[] = KNOWN_BRANDS.map((brand) => ({
  key: `padel-rackets-${brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  searchTerm: `${brand} padel racket`,
  category: "rackets",
  sport: "padel",
  productType: null,
  limit: 50,
  include: /padel\s?-?(racket|bat)|padelracket/i,
  exclude: new RegExp(`${NOT_A_RACKET.source}|${NOT_GEAR.source}`, "i"),
  minPrice: 40,
}));

export const DISCOVERY_TARGETS: DiscoveryTarget[] = [...BASE_TARGETS, ...BRAND_RACKET_TARGETS];

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Known brand at the start of the title (bol titles start with the brand). */
export function brandFromTitle(title: string): string | null {
  const t = ` ${normalize(title)} `;
  for (const brand of [...KNOWN_BRANDS].sort((a, b) => b.length - a.length)) {
    if (t.startsWith(` ${normalize(brand)} `)) return brand;
  }
  return null;
}

/** Colours and other words that describe a variant, not the model. */
const NOISE =
  /\b(zwart|wit|grijs|grijsgroene?|grijs-wit|rood|blauw|donkerblauw|lichtblauw|geel|groen|oranje|roze|paars|zilver|goud|black|white|grey|gray|red|blue|navy|yellow|green|orange|pink|purple|silver|gold|zwart-oranje|zwart-wit|default|volwassenen|unisex|kleur|color|colour|tennis|box)\b/gi;

/** Words that only name the kind of product; the page shows that already. */
const GENERIC: Record<string, RegExp> = {
  rackets: /\b(padel ?rackets?\w*|padelrackets?\w*|rackets?|padel)\b/gi,
  balls: /\b(padelballen|padelbal|ballen|bal|padel)\b/gi,
  grips: /\b(padel)\b/gi,
  bags: /\b(padeltas|padel ?tas|racketbag|tas|bag|padel)\b/gi,
};

/** Pack sizes, colour labels and product codes such as "3 stuks", "2x3", "BPP26003", "049050". */
const PACKS =
  /\b(\d+\s*(stuks|stuk|pack|pak|blikken|blik|ballen)\b(\s*van\s*\d+\s*ballen)?|\d+-pack|\d+\s*x\s*\d+|[A-Z]{2,}\d{4,}|\d{5,})\b/gi;

const titleCase = (word: string) =>
  /^[a-z][a-z]+$/.test(word) ? word.charAt(0).toUpperCase() + word.slice(1) : word;

/**
 * Model and year from a bol title such as
 * "Adidas Metalbone 3.4 2025 - Padelracket - Zwart/Rood" → { model: "Metalbone 3.4", year: 2025 }.
 * Only the part before the first separator counts. Colours, pack sizes, product codes,
 * text in brackets and words that only name the kind of product are dropped.
 */
export function modelFromTitle(
  title: string,
  brand: string,
  kind: keyof typeof GENERIC = "rackets",
): { model: string; year: number | null } {
  const head = title.split(/\s?[-|–]\s|,\s/)[0]!.trim();
  let rest = head.slice(head.toLowerCase().indexOf(brand.toLowerCase()) + brand.length);
  const yearMatch = rest.match(/\b(20[2-3]\d)\b/);
  const year = yearMatch ? Number(yearMatch[1]) : null;
  rest = rest
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b20[2-3]\d\b/, " ")
    .replace(PACKS, " ")
    .replace(GENERIC[kind]!, " ")
    .replace(NOISE, " ")
    .replace(/[:/]/g, " ")
    .replace(/(^|\s)\d(?=\s|$)/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/^[-–:+]\s*|\s*[-–:]$/g, "");
  const model = rest.split(" ").filter(Boolean).map(titleCase).join(" ");
  return { model, year };
}

export function slugify(s: string): string {
  return normalize(s).replace(/\s+/g, "-").slice(0, 80).replace(/-+$/, "");
}

export type BolSearchResult = {
  ean?: string;
  title?: string;
  url?: string;
  image?: { url?: string };
  offer?: { price?: number; condition?: string };
};

export type NewProduct = {
  ean: string;
  brand: string;
  model: string;
  year: number | null;
  title: string;
  slug: string;
  category: CategoryKey;
  sport: SportKey;
  productType: ProductType | null;
};

/**
 * Search results that become new products: a valid EAN we do not have yet, a known brand,
 * a title that passes the target's filters, a model name and a price above the minimum.
 * One product per brand + model + year (bol lists colour variants separately).
 */
export function selectNewProducts(
  results: BolSearchResult[],
  target: DiscoveryTarget,
  known: { eans: Set<string>; keys: Set<string>; slugs: Set<string> },
): NewProduct[] {
  const picked: NewProduct[] = [];
  for (const r of results) {
    const ean = r.ean?.trim();
    const title = r.title?.trim();
    if (!ean || !title || !validGtin(ean) || known.eans.has(ean)) continue;
    if (!target.include.test(title) || target.exclude.test(title)) continue;
    if (!(r.offer?.price && r.offer.price >= target.minPrice)) continue;
    if (r.offer.condition && r.offer.condition.toUpperCase() !== "NEW") continue;
    const brand = brandFromTitle(title);
    if (!brand) continue;
    const { model, year } = modelFromTitle(title, brand, target.productType ?? "rackets");
    if (model.length < 2 || model.length > 60 || !/[a-z]/i.test(model)) continue;

    const key = `${brand}|${model.toLowerCase()}|${year ?? ""}`;
    if (known.keys.has(key)) continue;
    const display = [brand, model, year].filter(Boolean).join(" ");
    let slug = slugify(display);
    if (known.slugs.has(slug)) slug = `${slug}-${ean.slice(-4)}`;
    if (known.slugs.has(slug)) continue;

    known.eans.add(ean);
    known.keys.add(key);
    known.slugs.add(slug);
    picked.push({
      ean,
      brand,
      model,
      year,
      title: display,
      slug,
      category: target.category,
      sport: target.sport,
      productType: target.productType,
    });
  }
  return picked;
}
