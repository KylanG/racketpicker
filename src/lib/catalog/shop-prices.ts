import type { ProductOffer } from "./product";

const AVAILABLE = new Set(["in_stock", "low_stock", "preorder", "unknown"]);
const round = (n: number) => Math.round(n * 100) / 100;

/** Shipping for this order: 0 above the shop's free-shipping threshold, null when unknown. */
export function effectiveShipping(o: ProductOffer): number | null {
  if (o.shippingCost === 0) return 0;
  if (o.shop.freeShippingFrom != null && o.price >= o.shop.freeShippingFrom) return 0;
  return o.shippingCost;
}

export type ShopRow = {
  offer: ProductOffer;
  available: boolean;
  /** Price shown: incl. shipping when that toggle is on and the shipping is known. */
  total: number;
  shipping: number | null;
  /** Cheapest available row, when there is more than one shop to compare. */
  isBest: boolean;
  /** Difference with the best deal, for available rows other than the best. */
  diff: number | null;
};

/**
 * Rows for "Prijzen bij X winkels": available offers by (total) price, sold-out ones at
 * the bottom. The order depends only on the price, never on a commission.
 */
export function shopRows(offers: ProductOffer[], includeShipping: boolean): ShopRow[] {
  const rows = offers.map((offer) => {
    const shipping = effectiveShipping(offer);
    return {
      offer,
      available: AVAILABLE.has(offer.stock),
      shipping,
      total: includeShipping && shipping != null ? round(offer.price + shipping) : offer.price,
      isBest: false,
      diff: null as number | null,
    };
  });
  rows.sort(
    (a, b) =>
      Number(b.available) - Number(a.available) ||
      a.total - b.total ||
      a.offer.shop.name.localeCompare(b.offer.shop.name),
  );
  const best = rows.find((r) => r.available);
  for (const r of rows) {
    if (!r.available || !best) continue;
    if (r === best) r.isBest = rows.length > 1;
    else r.diff = round(r.total - best.total);
  }
  return rows;
}
