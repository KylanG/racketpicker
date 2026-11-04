/** A price checked by hand on the shop's own product page (RP-68). */
export type ManualOffer = {
  shop: string;
  product: string;
  price: number;
  shipping?: number;
  stock: "in_stock" | "low_stock" | "out_of_stock" | "preorder" | "unknown";
  url: string;
  /** YYYY-MM-DD, the day the price was seen. */
  checkedOn: string;
};

/** Days a manual price stays visible after its check. Same rule as in SQL. */
export const MANUAL_OFFER_DAYS = 7;

const SLUG = /^[a-z0-9-]{1,80}$/;

/** Problems in the list; the cron refuses to import when there are any. */
export function validateManualOffers(offers: ManualOffer[], today = new Date()): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const todayIso = today.toISOString().slice(0, 10);
  offers.forEach((o, i) => {
    const at = `#${i + 1} (${o.shop}/${o.product})`;
    if (!SLUG.test(o.shop)) errors.push(`${at}: invalid shop slug`);
    if (!SLUG.test(o.product)) errors.push(`${at}: invalid product slug`);
    if (!(o.price > 0 && o.price < 10_000)) errors.push(`${at}: price out of range`);
    if (o.shipping != null && !(o.shipping >= 0 && o.shipping < 100))
      errors.push(`${at}: shipping out of range`);
    if (!/^https:\/\/[^\s]+$/.test(o.url)) errors.push(`${at}: url must be https`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(o.checkedOn) || Number.isNaN(Date.parse(o.checkedOn))) {
      errors.push(`${at}: checkedOn must be YYYY-MM-DD`);
    } else if (o.checkedOn > todayIso) {
      errors.push(`${at}: checkedOn is in the future`);
    }
    const key = `${o.shop}|${o.product}`;
    if (seen.has(key)) errors.push(`${at}: duplicate shop + product`);
    seen.add(key);
  });
  return errors;
}

/** Payload for the SQL function upsert_manual_offers(). */
export function toRpcItems(offers: ManualOffer[]) {
  return offers.map((o) => ({
    shop: o.shop,
    product: o.product,
    price: o.price,
    shipping: o.shipping ?? null,
    stock: o.stock,
    url: o.url,
    checked_on: o.checkedOn,
  }));
}
