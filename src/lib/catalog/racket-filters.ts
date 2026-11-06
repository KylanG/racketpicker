import type { SportKey } from "./taxonomy";

/**
 * Filters of the rackets overview (design/handoff/Rackets.dc.html), kept in the URL:
 * /nl/rackets/padel?merk=adidas&niveau=gevorderd&deals=1
 * Values are stable, Dutch URL slugs (shared across markets; labels come from messages).
 */
export type RacketItem = {
  id: string;
  href: string;
  name: string;
  brand: { slug: string; name: string };
  sport: SportKey;
  imageUrl: string | null;
  price: number | null;
  compareAt: number | null;
  discount: number | null;
  shopCount: number;
  inStock: boolean;
  /** Set when the lowest price is a hand-checked one (RP-68): the day it was checked. */
  checkedOn: string | null;
  levels: Level[];
  style: Style | null;
  /** Midpoint of the weight range in grams. */
  weight: number | null;
  /** Accessories only (RP-78): balls, grips or bags, as the URL slug. */
  kind?: Kind | null;
};

export const LEVELS = ["beginner", "gemiddeld", "gevorderd", "competitie"] as const;
export const STYLES = ["controle", "allround", "power"] as const;
export const WEIGHTS = ["licht", "gemiddeld", "zwaar"] as const;
export const PRICES = ["tot-75", "75-150", "150-250", "250-plus"] as const;
/** Accessory types (RP-78), in tab order; `products.product_type` → URL slug. */
export const KINDS = ["tassen", "ballen", "grips"] as const;

export type Level = (typeof LEVELS)[number];
export type Style = (typeof STYLES)[number];
export type Weight = (typeof WEIGHTS)[number];
export type PriceBucket = (typeof PRICES)[number];
export type Kind = (typeof KINDS)[number];

export const KIND_FROM_DB: Record<string, Kind> = {
  bags: "tassen",
  balls: "ballen",
  grips: "grips",
};

/** Database enums → URL slugs. */
export const LEVEL_FROM_DB: Record<string, Level> = {
  beginner: "beginner",
  intermediate: "gemiddeld",
  advanced: "gevorderd",
  pro: "competitie",
};
export const STYLE_FROM_DB: Record<string, Style> = {
  control: "controle",
  all_round: "allround",
  power: "power",
};

const PRICE_RANGES: Record<PriceBucket, [number, number]> = {
  "tot-75": [0, 75],
  "75-150": [75, 150],
  "150-250": [150, 250],
  "250-plus": [250, Number.POSITIVE_INFINITY],
};

/** Weight classes per sport (grams, midpoint of the range). Padel: light < 355 ≤ medium ≤ 365 < heavy. */
const WEIGHT_LIMITS: Partial<Record<SportKey, [number, number]>> = {
  padel: [355, 365],
  tennis: [285, 305],
  badminton: [83, 88],
  squash: [125, 140],
  pickleball: [220, 235],
};

export function weightClass(sport: SportKey, grams: number | null): Weight | null {
  const limits = WEIGHT_LIMITS[sport];
  if (grams == null || !limits) return null;
  if (grams < limits[0]) return "licht";
  return grams <= limits[1] ? "gemiddeld" : "zwaar";
}

export function priceBucket(price: number | null): PriceBucket | null {
  if (price == null) return null;
  return PRICES.find((b) => price >= PRICE_RANGES[b][0] && price < PRICE_RANGES[b][1]) ?? null;
}

export type Facet = "soort" | "merk" | "prijs" | "niveau" | "stijl" | "gewicht";
/** "soort" only has options for accessories; facets without options are hidden. */
export const FACETS: Facet[] = ["soort", "merk", "prijs", "niveau", "stijl", "gewicht"];

/** Result order (RP-27). "populair": most shops first; absent = the page's default. */
export const SORTS = ["populair", "prijs-laag", "prijs-hoog", "korting"] as const;
export type Sort = (typeof SORTS)[number];

/** Products per page; divisible by 2, 3 and 4 so every grid width ends on a full row. */
export const PAGE_SIZE = 24;

export type RacketFilters = {
  soort: Kind[];
  merk: string[];
  prijs: PriceBucket[];
  niveau: Level[];
  stijl: Style[];
  gewicht: Weight[];
  deals: boolean;
  hideSoldOut: boolean;
  /** Chosen order; not a filter, but kept in the URL alongside them. */
  sort?: Sort;
};

export const EMPTY_FILTERS: RacketFilters = {
  soort: [],
  merk: [],
  prijs: [],
  niveau: [],
  stijl: [],
  gewicht: [],
  deals: false,
  hideSoldOut: false,
};

type Params = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : [])
    .flatMap((x) => x.split(","))
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

const only = <T extends string>(values: string[], allowed: readonly T[]) =>
  [...new Set(values)].filter((v): v is T => (allowed as readonly string[]).includes(v)).sort();

/** Parses search params; unknown values are dropped, so odd URLs never break the page. */
export function parseFilters(params: Params): RacketFilters {
  return {
    soort: only(list(params.soort), KINDS),
    merk: [...new Set(list(params.merk).filter((s) => /^[a-z0-9-]{1,60}$/.test(s)))].sort(),
    prijs: only(list(params.prijs), PRICES),
    niveau: only(list(params.niveau), LEVELS),
    stijl: only(list(params.stijl), STYLES),
    gewicht: only(list(params.gewicht), WEIGHTS),
    deals: list(params.deals).includes("1"),
    hideSoldOut: list(params.uitverkocht).includes("verberg"),
    sort: only(list(params.sorteer), SORTS)[0],
  };
}

/** Page number from ?pagina= (1 when absent or invalid); pages show cumulatively. */
export function parsePage(params: Params): number {
  const n = Number(list(params.pagina)[0]);
  return Number.isInteger(n) && n > 1 && n < 1000 ? n : 1;
}

/** Sorted or paged lists are variations of the plain page: noindex, canonical to it. */
export function isListingVariant(params: Params): boolean {
  return parseFilters(params).sort !== undefined || parsePage(params) > 1;
}

/**
 * Orders items (RP-27). Sold-out items still go last afterwards (applyFilters).
 * "populair" = most shops first (the best comparisons), then with a photo, then as listed.
 */
export function sortItems(items: RacketItem[], sort: Sort): RacketItem[] {
  const indexed = items.map((item, index) => ({ item, index }));
  const byPrice = (dir: 1 | -1) => (a: RacketItem, b: RacketItem) =>
    a.price == null ? 1 : b.price == null ? -1 : dir * (a.price - b.price);
  const compare: (a: RacketItem, b: RacketItem) => number =
    sort === "prijs-laag"
      ? byPrice(1)
      : sort === "prijs-hoog"
        ? byPrice(-1)
        : sort === "korting"
          ? (a, b) => (b.discount ?? 0) - (a.discount ?? 0)
          : (a, b) => b.shopCount - a.shopCount || Number(!!b.imageUrl) - Number(!!a.imageUrl);
  return indexed
    .sort((a, b) => compare(a.item, b.item) || a.index - b.index)
    .map(({ item }) => item);
}

/** Query string for filters, in a fixed order so equal filters give equal URLs. */
export function filtersToQuery(f: RacketFilters): string {
  const q = new URLSearchParams();
  for (const facet of FACETS) if (f[facet].length) q.set(facet, f[facet].join(","));
  if (f.deals) q.set("deals", "1");
  if (f.hideSoldOut) q.set("uitverkocht", "verberg");
  if (f.sort) q.set("sorteer", f.sort);
  const s = q.toString().replace(/%2C/g, ",");
  return s ? `?${s}` : "";
}

export function activeFilterCount(f: RacketFilters): number {
  return (
    FACETS.reduce((n, facet) => n + f[facet].length, 0) +
    (f.deals ? 1 : 0) +
    (f.hideSoldOut ? 1 : 0)
  );
}

export function toggleValue(f: RacketFilters, facet: Facet, value: string): RacketFilters {
  const current = f[facet] as string[];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value].sort();
  return { ...f, [facet]: next };
}

function facetValues(item: RacketItem, facet: Facet): string[] {
  switch (facet) {
    case "soort":
      return item.kind ? [item.kind] : [];
    case "merk":
      return [item.brand.slug];
    case "prijs": {
      const b = priceBucket(item.price);
      return b ? [b] : [];
    }
    case "niveau":
      return item.levels;
    case "stijl":
      return item.style ? [item.style] : [];
    case "gewicht": {
      const w = weightClass(item.sport, item.weight);
      return w ? [w] : [];
    }
  }
}

function matches(item: RacketItem, f: RacketFilters, skip?: Facet): boolean {
  if (f.deals && item.discount == null) return false;
  if (f.hideSoldOut && !item.inStock) return false;
  return FACETS.every((facet) => {
    if (facet === skip || f[facet].length === 0) return true;
    const values = facetValues(item, facet);
    return (f[facet] as string[]).some((v) => values.includes(v));
  });
}

/** Filtered items; sold-out products always last (design rule). */
export function applyFilters(items: RacketItem[], f: RacketFilters): RacketItem[] {
  const result = items.filter((i) => matches(i, f));
  return [...result.filter((i) => i.inStock), ...result.filter((i) => !i.inStock)];
}

/**
 * Result count per option of a facet: the number of results if that option were the
 * facet's only choice, with all other filters applied (standard faceting, so checking
 * an option with count n shows n more matches within the facet's OR).
 */
export function facetCounts(
  items: RacketItem[],
  f: RacketFilters,
  facet: Facet,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!matches(item, f, facet)) continue;
    for (const v of new Set(facetValues(item, facet))) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return counts;
}

/** Count for a switch (deals / hide sold-out) if it were turned on. */
export function switchCount(
  items: RacketItem[],
  f: RacketFilters,
  key: "deals" | "hideSoldOut",
): number {
  return items.filter((i) => matches(i, { ...f, [key]: true })).length;
}

/**
 * Only the sport page, sport + one brand and (accessories) sport + one type are indexable; other combinations get
 * noindex and a canonical to the sport page (design/handoff/README.md).
 */
export function isIndexable(f: RacketFilters): boolean {
  if (f.sort) return false;
  const n = activeFilterCount(f);
  return n === 0 || (n === 1 && (f.merk.length === 1 || f.soort.length === 1));
}
