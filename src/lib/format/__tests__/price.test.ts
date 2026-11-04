import { describe, expect, it } from "vitest";
import { formatPrice, priceDifference } from "../price";

describe("formatPrice", () => {
  it.each([
    [96.74, "€96,74"],
    [279, "€279"],
    [1299, "€1.299"],
    [1299.5, "€1.299,50"],
    [0.1, "€0,10"],
  ])("nl: %s → %s", (value, expected) => expect(formatPrice(value, "nl")).toBe(expected));

  it("keeps the Spanish convention", () =>
    expect(formatPrice(96.74, "es").replace(/\s/g, " ")).toBe("96,74 €"));
});

describe("priceDifference", () => {
  it("rounds to cents", () => expect(priceDifference(0.3, 0.1)).toBe(0.2));
  it("handles prices", () => expect(priceDifference(299.95, 289.95)).toBe(10));
});
