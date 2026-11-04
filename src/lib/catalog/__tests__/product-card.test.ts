import { describe, expect, it } from "vitest";
import { discountPercent, sizeSummary, soldOutLast } from "../product-card";

describe("discountPercent", () => {
  it("rounds the discount vs. the 30-day low", () => expect(discountPercent(239, 289.95)).toBe(18));
  it.each([
    [100, 100],
    [100, 90],
    [100, null],
    [null, 120],
    [99.6, 100], // < 1%
  ])("no discount for %s vs %s", (price, compareAt) =>
    expect(discountPercent(price, compareAt)).toBeNull(),
  );
});

describe("sizeSummary", () => {
  it("shows the range when no size is chosen", () =>
    expect(sizeSummary({ available: ["44", "40", "42", "46"] })).toEqual({
      kind: "range",
      min: "40",
      max: "46",
    }));

  it("shows the chosen sizes that are available", () =>
    expect(sizeSummary({ available: ["40", "42", "43"], selected: ["42", "43", "45"] })).toEqual({
      kind: "fit",
      sizes: "42, 43",
    }));

  it("falls back to the range when none of the chosen sizes is available", () =>
    expect(sizeSummary({ available: ["40", "41"], selected: ["45"] })).toEqual({
      kind: "range",
      min: "40",
      max: "41",
    }));

  it("handles half sizes", () =>
    expect(sizeSummary({ available: ["42.5", "41", "44"] })).toMatchObject({
      min: "41",
      max: "44",
    }));

  it("returns null without sizes", () => expect(sizeSummary(undefined)).toBeNull());
});

describe("soldOutLast", () => {
  it("moves sold-out items to the end and keeps the order", () =>
    expect(
      soldOutLast([
        { id: "a", inStock: false },
        { id: "b", inStock: true },
        { id: "c", inStock: false },
        { id: "d", inStock: true },
      ]).map((i) => i.id),
    ).toEqual(["b", "d", "a", "c"]));
});
