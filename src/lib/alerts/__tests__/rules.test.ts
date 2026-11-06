import { describe, expect, it } from "vitest";
import { parseTarget, shouldNotify } from "../rules";

describe("shouldNotify", () => {
  it("mails a price alert once the lowest available price reaches the target", () => {
    const alert = { kind: "price" as const, target_price: 150 };
    expect(shouldNotify(alert, { lowest: 151 })).toBe(false);
    expect(shouldNotify(alert, { lowest: 150 })).toBe(true);
    expect(shouldNotify(alert, { lowest: null })).toBe(false);
  });
  it("mails a stock alert as soon as any shop has it", () => {
    const alert = { kind: "stock" as const, target_price: null };
    expect(shouldNotify(alert, { lowest: null })).toBe(false);
    expect(shouldNotify(alert, { lowest: 99 })).toBe(true);
  });
});

describe("parseTarget", () => {
  it("accepts euros with a comma or dot and rejects odd values", () => {
    expect(parseTarget("149")).toBe(149);
    expect(parseTarget("149,5")).toBe(149.5);
    expect(parseTarget(0)).toBeNull();
    expect(parseTarget("abc")).toBeNull();
    expect(parseTarget(20_000)).toBeNull();
  });
});
