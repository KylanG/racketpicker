import { compareAtPrice, discountPercent, isLowestIn90Days, type PriceStats } from "./pricing";
import type { ProductOffer } from "./product";

/** Prototype states (prop `staat`): Normaal, Uitverkocht, Eén winkel, Geen prijshistorie. */
export type PriceState = "normal" | "single" | "soldOut" | "noPrice";

export type PriceSummary = {
  state: PriceState;
  /** Cheapest available offer; for "soldOut" the cheapest offer at all. */
  best: ProductOffer | null;
  /** Omnibus comparison price (lowest of the 30 days before the reduction), or null. */
  compareAt: number | null;
  discount: number | null;
  lowestIn90Days: boolean;
  /** Saving vs. the MSRP; only with the label "adviesprijs". */
  saveMsrp: number | null;
  /** Difference between the cheapest and the most expensive available shop. */
  saveShops: number | null;
  availableCount: number;
  shopCount: number;
};

const AVAILABLE = new Set(["in_stock", "low_stock", "preorder", "unknown"]);
const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Everything the price block shows, from the active offers and the price statistics.
 * The comparison price and "laagste prijs in 90 dagen" follow the Omnibus rules (RP-41);
 * the cheapest offer decides, never the commission.
 */
export function summarizePrices(
  offers: ProductOffer[],
  stats: PriceStats | null,
  today?: Date,
): PriceSummary {
  const byPrice = [...offers].sort((a, b) => a.price - b.price);
  const available = byPrice.filter((o) => AVAILABLE.has(o.stock));
  const best = available[0] ?? byPrice[0] ?? null;
  const shopCount = new Set(byPrice.map((o) => o.shop.slug)).size;
  const availableShops = new Set(available.map((o) => o.shop.slug)).size;

  const state: PriceState = !best
    ? "noPrice"
    : available.length === 0
      ? "soldOut"
      : availableShops === 1
        ? "single"
        : "normal";

  // Statistics are about the cheapest available offer; only trust them when they agree.
  const statsMatch = stats != null && best != null && stats.currentPrice === best.price;
  const compareAt = state !== "soldOut" && statsMatch ? compareAtPrice(stats) : null;
  const msrp = stats?.msrp ?? null;
  const highest = available.at(-1)?.price ?? null;

  return {
    state,
    best,
    compareAt,
    discount: compareAt != null && statsMatch ? discountPercent(stats) : null,
    lowestIn90Days: state !== "soldOut" && statsMatch ? isLowestIn90Days(stats, today) : false,
    saveMsrp:
      state !== "soldOut" && best && msrp != null && msrp > best.price
        ? round(msrp - best.price)
        : null,
    saveShops:
      available.length > 1 && best && highest != null && highest > best.price
        ? round(highest - best.price)
        : null,
    availableCount: availableShops,
    shopCount,
  };
}
