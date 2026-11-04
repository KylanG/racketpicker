import type { ManualOffer } from "@/lib/feeds/manual-offers";

/**
 * Hand-checked prices (RP-68), until the affiliate feeds run. The daily cron sends this
 * list to Supabase; an offer is shown for 7 days after `checkedOn` and then hidden until
 * it is checked again. Removing a line turns the offer off.
 *
 * Rules:
 * - Only prices you saw yourself on the shop's product page, on that date.
 * - `url` is the public product page (no affiliate link).
 * - `shop` is a slug from the shops table, `product` the product slug (product_content).
 *
 * Filled by the starter catalog (RP-69).
 */
export const MANUAL_OFFERS: ManualOffer[] = [];
