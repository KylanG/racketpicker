/**
 * New products from affiliate feeds (RP-91). Pure part: which unmatched feed items become
 * a product. The I/O lives in create-products.ts and run-import.ts.
 *
 * Only items the matcher found nothing for, or only another model year: an item with a
 * suggestion may be a product we already have under another name, so it stays in the
 * review queue instead.
 */
import { validGtin } from "./bol";
import {
  brandFromTitle,
  KNOWN_BRANDS,
  modelFromTitle,
  slugify,
  type NewProduct,
  type ProductType,
} from "./bol-discovery";
import { extractYear } from "./match";
import type { PreparedItem } from "./pipeline";
import { COLOUR_WORDS, PRODUCT_CODE, withoutPlayers } from "./variant-words";

/** Lowest price that is a real product of its kind, not a spare part or a mini version. */
const MIN_PRICE: Record<"rackets" | "bags", number> = { rackets: 40, bags: 15 };

/** Mini rackets and other things that are not the product itself (juniors: see filter.ts). */
const SKIP = /\b(kids?|junior|jr|mini|keychain|sleutelhanger|beach|replica)\b/i;

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Title as the model cleanup should see it: without player names, product codes such as
 * "BPP-24012" and colours ("Grey/Orange"), so colour variants become one product.
 */
export function cleanFeedTitle(title: string): string {
  // A backpack and a racket bag of one series are two products: keep "Backpack" in the name.
  const outside = title.replace(/\([^)]*\)/g, " ");
  const kept = /\b(backpack|mochila)\b/i.test(outside)
    ? title
    : title.replace(/\((backpack|mochila)\)/gi, " Backpack ");
  return withoutPlayers(kept.replace(PRODUCT_CODE, " "))
    .split(/(\s+|\/)/)
    .filter((w) => !COLOUR_WORDS.has(w.toLowerCase()))
    .join("")
    .replace(/(^|\s)\/+(?=\s|$)/g, " ")
    .replace(/\/+(?=\s|\(|$)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Brand in our spelling: from the feed's brand column, else from the start of the title. */
export function knownBrand(feedBrand: string | null, title: string): string | null {
  if (feedBrand) {
    const hit = KNOWN_BRANDS.find((b) => norm(b) === norm(feedBrand));
    if (hit) return hit;
  }
  return brandFromTitle(title);
}

export type KnownCatalog = {
  eans: Set<string>;
  keys: Set<string>;
  slugs: Set<string>;
  /** Model year per product id, to recognise a suggestion that is last year's model. */
  years: Map<string, number | null>;
};

/**
 * True when the item names another model year than the suggested product: "Vertex 05 2027"
 * next to our "Vertex 05 2026" is a new product, not a doubt. A product without a year
 * (could be either) stays a doubt for the review queue.
 */
function newerOrOlderYear(item: PreparedItem, known: KnownCatalog): boolean {
  if (item.match.status !== "pending" || !item.match.suggestedProductId) return false;
  const productYear = known.years.get(item.match.suggestedProductId);
  const itemYear = extractYear(item.title);
  return productYear != null && itemYear != null && productYear !== itemYear;
}

/**
 * Feed items that become new products: no match and no suggestion, a valid EAN we do not
 * have, a known brand, a model name and a price above the minimum for its kind. One product
 * per brand + model + year + kind; `known` is updated so a second run does not add it again.
 */
export function selectFeedProducts(items: PreparedItem[], known: KnownCatalog): NewProduct[] {
  const picked: NewProduct[] = [];
  for (const item of items) {
    const { kind, match } = item;
    if (!kind || match.status !== "pending") continue;
    if (match.suggestedProductId && !newerOrOlderYear(item, known)) continue;
    const kindKey =
      kind.productType === "bags" ? "bags" : kind.category === "rackets" ? "rackets" : null;
    if (!kindKey) continue;
    const ean = item.gtin;
    if (!ean || !validGtin(ean) || known.eans.has(ean)) continue;
    // Out of stock: wait until the shop has it, so no page starts without anything to buy.
    if (item.price < MIN_PRICE[kindKey] || item.stockStatus === "out_of_stock") continue;
    if (SKIP.test(item.title)) continue;
    const brand = knownBrand(item.brand, item.title);
    if (!brand) continue;
    let title = cleanFeedTitle(item.title).replace(/\bfor\s+(wo)?men\b/gi, " ");
    // A bag "for" a racket series: "Wilson Tour Racket Bag" is the Wilson Tour bag.
    if (kindKey === "bags") title = title.replace(/\b(racket|racquet|pala)s?\b/gi, " ");
    const { model, year } = modelFromTitle(title, brand, kindKey);
    if (model.length < 2 || model.length > 60 || !/[a-z]/i.test(model)) continue;

    const key = `${brand}|${model.toLowerCase()}|${year ?? ""}|${kindKey}`;
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
      category: kind.category,
      sport: "padel",
      productType: kind.productType as ProductType | null,
    });
  }
  return picked;
}
