import { describe, expect, it } from "vitest";
import {
  compareAtPrice,
  discountPercent,
  historyDays,
  isFeaturedDeal,
  isLowestIn90Days,
  isOnSale,
  priceStatsFromRow,
  type PriceStats,
} from "../pricing";

const today = new Date("2026-11-04T10:00:00Z");
const daysAgo = (n: number) => new Date(Date.UTC(2026, 10, 4 - n)).toISOString().slice(0, 10);

// A deal: reduced 3 days ago from a 30-day low of 250 to 200, with 90 days of history.
const stats = (over: Partial<PriceStats> = {}): PriceStats => ({
  currentPrice: 200,
  reducedSince: daysAgo(3),
  priorPrice: 250,
  lowest90d: 200,
  avg90d: 260,
  highest90d: 289,
  firstRecordedOn: daysAgo(89),
  msrp: 299.95,
  ...over,
});

describe("historyDays", () => {
  it("counts calendar days including today", () => {
    expect(historyDays(daysAgo(0), today)).toBe(1);
    expect(historyDays(daysAgo(89), today)).toBe(90);
  });
  it("is 0 without history or with a future date", () => {
    expect(historyDays(null, today)).toBe(0);
    expect(historyDays(daysAgo(-2), today)).toBe(0);
  });
});

describe("Omnibus discount", () => {
  it("measures against the 30 days before the reduction", () => {
    expect(compareAtPrice(stats())).toBe(250);
    expect(discountPercent(stats())).toBe(20);
    expect(isOnSale(stats())).toBe(true);
  });

  it("keeps the discount while the reduced price lasts", () =>
    expect(discountPercent(stats({ reducedSince: daysAgo(20) }))).toBe(20));

  it("never uses the MSRP as basis", () =>
    expect(discountPercent(stats({ priorPrice: null, msrp: 400 }))).toBeNull());

  it("needs history covering the 30 days before the reduction", () => {
    // Reduced 3 days ago: history must start at least 33 days ago.
    expect(discountPercent(stats({ firstRecordedOn: daysAgo(32) }))).toBeNull();
    expect(discountPercent(stats({ firstRecordedOn: daysAgo(33) }))).toBe(20);
    expect(compareAtPrice(stats({ firstRecordedOn: null }))).toBeNull();
  });

  it("is no deal when the price was never higher", () =>
    expect(isOnSale(stats({ reducedSince: null, priorPrice: null }))).toBe(false));

  it("is no deal after raising and lowering again", () =>
    // Today 200, raised to 260 last week, but 190 in the 30 days before that.
    expect(isOnSale(stats({ reducedSince: daysAgo(0), priorPrice: 190 }))).toBe(false));

  it("ignores discounts below 1%", () =>
    expect(discountPercent(stats({ currentPrice: 249, priorPrice: 250 }))).toBeNull());

  it("needs a current price", () => expect(isOnSale(stats({ currentPrice: null }))).toBe(false));
});

describe("isLowestIn90Days", () => {
  it("is true at the 90-day low with 90 days of history", () =>
    expect(isLowestIn90Days(stats(), today)).toBe(true));
  it("needs 90 days of history", () =>
    expect(isLowestIn90Days(stats({ firstRecordedOn: daysAgo(88) }), today)).toBe(false));
  it("is false above the 90-day low", () =>
    expect(isLowestIn90Days(stats({ lowest90d: 190 }), today)).toBe(false));
});

describe("priceStatsFromRow", () => {
  it("converts numeric strings", () =>
    expect(
      priceStatsFromRow({
        current_price: "99.99" as unknown as number,
        reduced_since: "2026-11-01",
        prior_price: 112.11,
        lowest_90d: null,
        avg_90d: null,
        highest_90d: null,
        first_recorded_on: "2026-08-07",
        msrp: null,
      }),
    ).toMatchObject({ currentPrice: 99.99, priorPrice: 112.11, reducedSince: "2026-11-01" }));
});

describe("isFeaturedDeal", () => {
  it("needs a real discount and the 90-day low", () => {
    expect(isFeaturedDeal(stats(), today)).toBe(true);
    expect(isFeaturedDeal(stats({ lowest90d: 190 }), today)).toBe(false);
    expect(isFeaturedDeal(stats({ priorPrice: 200 }), today)).toBe(false);
  });
});
