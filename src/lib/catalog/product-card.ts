/**
 * Data a product card needs, independent of where it comes from (Supabase, seed, demo).
 * Prices follow the Omnibus rule: `compareAt` is the lowest price of the 30 days before
 * the reduction, never an MSRP. Compute it with `compareAtPrice()` (src/lib/catalog/pricing.ts).
 */
export type ProductCardData = {
  id: string;
  href: string;
  brand: string;
  /** Localized sport label, e.g. "Padel". */
  sport: string;
  /** Full product name including brand, e.g. "Adidas Metalbone 2026". */
  name: string;
  imageUrl: string | null;
  /** Level, play style, weight… already localized. */
  tags: string[];
  /** Lowest current price across shops; null when no shop has a price. */
  price: number | null;
  /** Lowest price of the 30 days before the reduction, shown struck through when higher than `price`. */
  compareAt?: number | null;
  shopCount: number;
  inStock: boolean;
  /** Extra line under the shop count, e.g. "Prijs gecontroleerd op 4 november" (RP-68). */
  priceNote?: string | null;
  /** Shoes: sizes in stock, for "Jouw maat 42, 43 leverbaar" / "Maten 40–46". */
  sizes?: { available: string[]; selected?: string[] };
};

/** Whole-percent discount vs. the 30-day low, or null when there is no real discount. */
export function discountPercent(price: number | null, compareAt?: number | null): number | null {
  if (price == null || compareAt == null || compareAt <= price) return null;
  const pct = Math.round((1 - price / compareAt) * 100);
  return pct >= 1 ? pct : null;
}

/**
 * Size line for shoe cards: the selected sizes that are available, otherwise the range.
 * Returns null for products without sizes.
 */
export function sizeSummary(
  sizes: ProductCardData["sizes"],
): { kind: "fit"; sizes: string } | { kind: "range"; min: string; max: string } | null {
  if (!sizes || sizes.available.length === 0) return null;
  const sorted = [...sizes.available].sort((a, b) => parseFloat(a) - parseFloat(b));
  const fit = sizes.selected?.filter((s) => sorted.includes(s)) ?? [];
  if (sizes.selected?.length && fit.length) return { kind: "fit", sizes: fit.join(", ") };
  return { kind: "range", min: sorted[0]!, max: sorted[sorted.length - 1]! };
}

/** Sold-out products always go last; the given order is kept within each group. */
export function soldOutLast<T extends { inStock: boolean }>(items: T[]): T[] {
  return [...items.filter((i) => i.inStock), ...items.filter((i) => !i.inStock)];
}
