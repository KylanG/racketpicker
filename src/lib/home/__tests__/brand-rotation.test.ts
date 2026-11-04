import { describe, expect, it } from "vitest";
import { nextSwap } from "../brand-rotation";

describe("nextSwap", () => {
  it("never shows a brand twice and never repeats the last slot", () => {
    let rnd = 0;
    const random = () => ((rnd = (rnd + 0.37) % 1), rnd);
    let slots = Array.from({ length: 12 }, (_, i) => i);
    let last: number | null = null;
    for (let n = 0; n < 200; n++) {
      const swap: { slot: number; brand: number } = nextSwap(slots, 26, last, random)!;
      expect(swap.slot).not.toBe(last);
      expect(slots).not.toContain(swap.brand);
      slots = slots.map((b, i) => (i === swap.slot ? swap.brand : b));
      expect(new Set(slots).size).toBe(12);
      last = swap.slot;
    }
  });

  it("returns null when all brands are visible", () =>
    expect(nextSwap([0, 1, 2], 3, null)).toBeNull());
});
