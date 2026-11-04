import type { CatalogProduct, MatchResult, NormalizedFeedItem } from "./types";

/** Score at or above which a name match is accepted automatically. */
export const AUTO_MATCH_SCORE = 0.9;
/** Below this, no suggestion is shown in the review queue. */
export const SUGGEST_SCORE = 0.5;
/** The best candidate must beat the runner-up by this much to auto-match. */
const UNIQUE_MARGIN = 0.1;

/** Words in feed titles that say nothing about which model it is. */
const NOISE = new Set([
  "padel",
  "padelracket",
  "racket",
  "rackets",
  "raquet",
  "pala",
  "bat",
  "de",
  "het",
  "the",
  "en",
  "and",
  "y",
  "men",
  "women",
  "heren",
  "dames",
  "unisex",
  "senior",
  "nieuw",
  "new",
  "edition",
]);

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function extractYear(text: string): number | null {
  const m = text.match(/\b(20[1-3]\d)\b/);
  return m ? Number(m[1]) : null;
}

/** Model tokens: normalized words minus noise, brand words and 4-digit years. */
export function modelTokens(text: string, brand: string): string[] {
  const brandWords = new Set(normalize(brand).split(" "));
  return normalize(text)
    .split(" ")
    .filter((t) => t && !NOISE.has(t) && !brandWords.has(t) && !/^20[1-3]\d$/.test(t));
}

/** Sørensen–Dice coefficient on token sets: 1 = identical, 0 = nothing in common. */
export function dice(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const shared = new Set(a.filter((t) => setB.has(t))).size;
  return (2 * shared) / (new Set(a).size + setB.size);
}

function brandMatches(item: NormalizedFeedItem, product: CatalogProduct): boolean {
  const brand = normalize(product.brand);
  if (item.brand) return normalize(item.brand) === brand;
  return ` ${normalize(item.title)} `.includes(` ${brand} `);
}

/** Similarity between a feed item and a catalog product, 0..1. */
export function scoreName(item: NormalizedFeedItem, product: CatalogProduct): number {
  if (!brandMatches(item, product)) return 0;
  const itemTokens = modelTokens(item.title, product.brand);
  const productTokens = modelTokens(product.model, product.brand);
  let score = dice(itemTokens, productTokens);

  // Every model word must be present: "Metalbone" must not match "Metalbone HRD".
  const itemSet = new Set(itemTokens);
  const extra = itemTokens.filter((t) => !productTokens.includes(t));
  const missing = productTokens.filter((t) => !itemSet.has(t));
  if (missing.length > 0) score *= 0.6;
  else if (extra.length > 0) score *= 0.85;

  // A different model year is a different product.
  const itemYear = extractYear(item.title);
  if (itemYear && product.modelYear && itemYear !== product.modelYear) score *= 0.5;
  // No year in the feed title: likely right, but could be last year's model → review.
  if (!itemYear && product.modelYear) score *= 0.85;

  return Math.round(score * 1000) / 1000;
}

/**
 * Matches one feed item: exact GTIN first, then name similarity.
 * Uncertain cases go to the review queue with the best suggestion.
 */
export function matchItem(
  item: NormalizedFeedItem,
  catalog: CatalogProduct[],
  gtinIndex: Map<string, string> = buildGtinIndex(catalog),
): MatchResult {
  if (item.gtin) {
    const productId = gtinIndex.get(item.gtin);
    if (productId) return { status: "matched", method: "gtin", productId, score: 1 };
  }

  let best: { id: string; score: number } | null = null;
  let second = 0;
  for (const product of catalog) {
    const score = scoreName(item, product);
    if (!best || score > best.score) {
      second = best?.score ?? 0;
      best = { id: product.id, score };
    } else if (score > second) {
      second = score;
    }
  }

  if (best && best.score >= AUTO_MATCH_SCORE && best.score - second >= UNIQUE_MARGIN) {
    return { status: "matched", method: "name", productId: best.id, score: best.score };
  }
  if (best && best.score >= SUGGEST_SCORE) {
    return { status: "pending", suggestedProductId: best.id, score: best.score };
  }
  return { status: "pending", suggestedProductId: null, score: best?.score ?? null };
}

export function buildGtinIndex(catalog: CatalogProduct[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const product of catalog) for (const gtin of product.gtins) index.set(gtin, product.id);
  return index;
}
