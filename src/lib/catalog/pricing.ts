/**
 * Omnibus price rules (RP-41). A discount is measured against the lowest price of the
 * 30 days before the price reduction, and only shown when the history covers those 30
 * days. The MSRP is never a discount basis; it may only be shown with the label
 * "adviesprijs". Data comes from the Supabase function `product_price_stats(market)`.
 */
export type PriceStats = {
  currentPrice: number | null;
  /** ISO date the current price level started (day after the last higher daily low). */
  reducedSince: string | null;
  /** Lowest daily price of the 30 days before `reducedSince`. */
  priorPrice: number | null;
  /** Lowest daily price of the last 90 days, today included. */
  lowest90d: number | null;
  avg90d: number | null;
  highest90d: number | null;
  /** ISO date (YYYY-MM-DD) of the first recorded price. */
  firstRecordedOn: string | null;
  msrp: number | null;
};

/** Days of history needed before the reduction for a discount to be shown. */
export const DISCOUNT_HISTORY_DAYS = 30;
/** Days of history needed for "laagste prijs in 90 dagen" (today included). */
export const LOWEST_LABEL_DAYS = 90;
/** Discounts below this percentage are not shown (rounding noise, not a real deal). */
const MIN_DISCOUNT_PERCENT = 1;

const DAY_MS = 86_400_000;

const toUtcDay = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const utcToday = (today: Date) =>
  Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

/** Calendar days between the first recorded price and `today`, today included. */
export function historyDays(firstRecordedOn: string | null, today: Date = new Date()): number {
  if (!firstRecordedOn) return 0;
  const first = toUtcDay(firstRecordedOn);
  const now = utcToday(today);
  if (Number.isNaN(first) || first > now) return 0;
  return Math.floor((now - first) / DAY_MS) + 1;
}

/**
 * Struck-through comparison price: the lowest price of the 30 days before the reduction,
 * but only when the history covers all of those days. Otherwise there is no legal basis
 * for a discount, so null.
 */
export function compareAtPrice(stats: PriceStats): number | null {
  const { reducedSince, priorPrice, firstRecordedOn } = stats;
  if (!reducedSince || priorPrice == null || !firstRecordedOn) return null;
  const covered = (toUtcDay(reducedSince) - toUtcDay(firstRecordedOn)) / DAY_MS;
  return covered >= DISCOUNT_HISTORY_DAYS ? priorPrice : null;
}

/** Whole-percent discount vs. the 30-day low, or null when there is no real discount. */
export function discountPercent(stats: PriceStats): number | null {
  const compareAt = compareAtPrice(stats);
  const price = stats.currentPrice;
  if (price == null || compareAt == null || compareAt <= price) return null;
  const pct = Math.round((1 - price / compareAt) * 100);
  return pct >= MIN_DISCOUNT_PERCENT ? pct : null;
}

/** A deal: today's lowest price is lower than the lowest price of the 30 days before the reduction. */
export function isOnSale(stats: PriceStats): boolean {
  return discountPercent(stats) !== null;
}

/** Today's price is the lowest of the last 90 days, with 90 days of history to prove it. */
export function isLowestIn90Days(stats: PriceStats, today?: Date): boolean {
  if (historyDays(stats.firstRecordedOn, today) < LOWEST_LABEL_DAYS) return false;
  return (
    stats.currentPrice != null && stats.lowest90d != null && stats.currentPrice <= stats.lowest90d
  );
}

type PriceStatsRow = {
  current_price: number | null;
  reduced_since: string | null;
  prior_price: number | null;
  lowest_90d: number | null;
  avg_90d: number | null;
  highest_90d: number | null;
  first_recorded_on: string | null;
  msrp: number | null;
};

const num = (v: number | string | null) => (v == null ? null : Number(v));

/** Maps a `product_price_stats` row (numeric columns may arrive as strings). */
export function priceStatsFromRow(row: PriceStatsRow): PriceStats {
  return {
    currentPrice: num(row.current_price),
    reducedSince: row.reduced_since,
    priorPrice: num(row.prior_price),
    lowest90d: num(row.lowest_90d),
    avg90d: num(row.avg_90d),
    highest90d: num(row.highest_90d),
    firstRecordedOn: row.first_recorded_on,
    msrp: num(row.msrp),
  };
}
