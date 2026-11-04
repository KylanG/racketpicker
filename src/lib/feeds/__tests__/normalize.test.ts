import { describe, expect, it } from "vitest";
import { normalizeGtin, parseDeliveryDays, parsePrice, parseStock } from "../normalize";

describe("parsePrice", () => {
  it.each([
    ["96,74", 96.74],
    ["96.74", 96.74],
    ["€ 96,74", 96.74],
    ["1.299,00", 1299],
    ["1,299.00", 1299],
    ["96.74 EUR", 96.74],
    ["0", 0],
  ])("%s → %s", (input, expected) => expect(parsePrice(input)).toBe(expected));

  it.each(["", "n/a", null, undefined])("%s → null", (input) =>
    expect(parsePrice(input)).toBeNull(),
  );
});

describe("normalizeGtin", () => {
  it("keeps EAN-13", () => expect(normalizeGtin("4066000000017")).toBe("4066000000017"));
  it("pads UPC-12 to EAN-13", () => expect(normalizeGtin("123456789012")).toBe("0123456789012"));
  it("strips spaces and dashes", () =>
    expect(normalizeGtin("4066 0000-00017")).toBe("4066000000017"));
  it.each(["", "123", "0000000000000", null])("rejects %s", (input) =>
    expect(normalizeGtin(input)).toBeNull(),
  );
});

describe("parseStock", () => {
  it.each([
    ["1", null, "in_stock"],
    ["true", null, "in_stock"],
    ["op voorraad", null, "in_stock"],
    ["0", null, "out_of_stock"],
    ["false", null, "out_of_stock"],
    ["uitverkocht", null, "out_of_stock"],
    ["1", "2", "low_stock"],
    ["1", "0", "out_of_stock"],
    [null, "12", "in_stock"],
    ["pre-order", null, "preorder"],
    [null, null, "unknown"],
  ] as const)("flag %s, qty %s → %s", (flag, qty, expected) =>
    expect(parseStock(flag, qty)).toBe(expected),
  );
});

describe("parseDeliveryDays", () => {
  it.each([
    ["1-3 werkdagen", [1, 3]],
    ["2 tot 4 dagen", [2, 4]],
    ["2", [2, 2]],
    ["Voor 23:00 besteld, morgen in huis", [1, 1]],
    ["24 uur", [1, 1]],
    ["", [null, null]],
  ] as const)("%s", (input, expected) => expect(parseDeliveryDays(input)).toEqual(expected));
});
