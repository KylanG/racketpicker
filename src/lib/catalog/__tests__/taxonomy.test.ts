import { describe, expect, it } from "vitest";
import { CATEGORIES, SPORTS, isCategory, sportFromSlug, sportSlug } from "../taxonomy";

describe("taxonomy", () => {
  it("has the six sports and four categories from the handover", () => {
    expect(SPORTS.map((s) => s.key)).toEqual([
      "padel",
      "tennis",
      "badminton",
      "squash",
      "pickleball",
      "table-tennis",
    ]);
    expect(CATEGORIES).toEqual(["rackets", "shoes", "clothing", "accessories"]);
  });

  it("localizes sport slugs per market", () => {
    expect(sportSlug("table-tennis", "nl")).toBe("tafeltennis");
    expect(sportSlug("table-tennis", "es")).toBe("tenis-de-mesa");
    expect(sportFromSlug("tafeltennis", "nl")).toBe("table-tennis");
  });

  it("rejects unknown or other-market slugs", () => {
    expect(sportFromSlug("voetbal", "nl")).toBeNull();
    expect(sportFromSlug("tenis-de-mesa", "nl")).toBeNull();
    expect(isCategory("rackets")).toBe(true);
    expect(isCategory("padel-rackets")).toBe(false);
  });

  it("has unique slugs per market", () => {
    for (const locale of ["nl", "es"] as const) {
      const slugs = SPORTS.map((s) => s.slug[locale]);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
});

describe("hasUnknownSport", async () => {
  const { hasUnknownSport } = await import("../route-guard");
  it.each([
    ["/nl/rackets/voetbal", true],
    ["/nl/rackets/table-tennis", true], // internal key, not the NL slug
    ["/nl/schoenen/hockey", true],
    ["/nl/rackets/padel", false],
    ["/nl/rackets/tafeltennis", false],
    ["/nl/rackets/padel/adidas-metalbone-2026", false],
    ["/nl/rackets", false],
    ["/nl/styleguide", false],
    ["/nl/blog/iets", false], // not a sport route
  ])("%s → %s", (path, expected) => expect(hasUnknownSport(path)).toBe(expected));
});
