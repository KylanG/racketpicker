import { describe, expect, it } from "vitest";
import type { RacketItem } from "@/lib/catalog/racket-filters";
import { rankRackets, scoreRacket } from "./scoring";

const racket = (over: Partial<RacketItem>): RacketItem => ({
  id: over.id ?? "r",
  href: "/nl/rackets/padel/r",
  name: over.id ?? "r",
  brand: { slug: "b", name: "B" },
  sport: "padel",
  imageUrl: null,
  price: 100,
  compareAt: null,
  discount: null,
  shopCount: 3,
  inStock: true,
  checkedOn: null,
  levels: ["beginner"],
  style: "controle",
  weight: null,
  ...over,
});

const full = {
  niveau: "beginner",
  stijl: "controle",
  frequentie: "wekelijks",
  budget: "75-150",
} as const;

describe("scoreRacket", () => {
  it("gives the maximum for a perfect match: 118 raw, 98%", () => {
    expect(scoreRacket(racket({}), full)).toEqual({
      raw: 118,
      percent: 98,
      reasons: ["level", "style", "inBudget"],
    });
  });

  it("scores one level apart, allround and above-budget partially", () => {
    const r = racket({ levels: ["gevorderd"], style: "allround", price: 180 });
    // 30 + 14 (one level) + 8 (allround) + 8 (≤ 1.25 × 150) + 8 (weekly, level ≤ 1)
    expect(scoreRacket(r, full)).toMatchObject({ raw: 68, percent: Math.round((68 / 118) * 98) });
  });

  it("gives 12 below budget and nothing far above it", () => {
    expect(scoreRacket(racket({ price: 60 }), full).raw).toBe(30 + 30 + 25 + 12 + 8);
    expect(scoreRacket(racket({ price: 200 }), full).raw).toBe(30 + 30 + 25 + 0 + 8);
  });

  it("counts both catalog levels gemiddeld and gevorderd as the advisor's gevorderd", () => {
    const a = { ...full, niveau: "gevorderd" as const };
    expect(scoreRacket(racket({ levels: ["gemiddeld"] }), a).reasons).toContain("level");
    expect(scoreRacket(racket({ levels: ["competitie"] }), a).reasons).not.toContain("level");
  });

  it("rewards frequent players with rackets for regular players or up", () => {
    const a = { ...full, frequentie: "vaak" as const };
    expect(scoreRacket(racket({ levels: ["beginner"] }), a).raw).toBe(110);
    expect(scoreRacket(racket({ levels: ["beginner", "gemiddeld"] }), a).reasons).toContain(
      "intensive",
    );
  });

  it("leaves budget and frequency out of the percentage when they are unknown", () => {
    expect(scoreRacket(racket({}), { niveau: "beginner", stijl: "controle" })).toEqual({
      raw: 85,
      percent: 98,
      reasons: ["level", "style"],
    });
  });
});

describe("rankRackets", () => {
  it("keeps the sport's rackets in stock, best first, cheapest first on a tie", () => {
    const ranked = rankRackets(
      [
        racket({ id: "dear", price: 140 }),
        racket({ id: "cheap", price: 90 }),
        racket({ id: "power", style: "power" }),
        racket({ id: "sold-out", inStock: false }),
        racket({ id: "no-price", price: null }),
        racket({ id: "tennis", sport: "tennis" }),
      ],
      { ...full, sport: "padel" },
    );
    expect(ranked.map((m) => m.item.id)).toEqual(["cheap", "dear", "power"]);
  });
});
