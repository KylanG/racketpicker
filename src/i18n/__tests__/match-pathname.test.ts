import { describe, expect, it } from "vitest";
import { matchLocalizedPathname } from "../match-pathname";

describe("matchLocalizedPathname", () => {
  it("matches the home page", () => {
    expect(matchLocalizedPathname("/nl", "nl")).toEqual({ pathname: "/", params: {} });
    expect(matchLocalizedPathname("/nl/", "nl")).toEqual({ pathname: "/", params: {} });
  });

  it("maps localized slugs back to the internal route", () => {
    expect(matchLocalizedPathname("/es/raquetas/tenis-de-mesa", "es")).toEqual({
      pathname: "/rackets/[sport]",
      params: { sport: "tenis-de-mesa" },
    });
    expect(matchLocalizedPathname("/nl/schoenen/padel", "nl")).toEqual({
      pathname: "/shoes/[sport]",
      params: { sport: "padel" },
    });
    expect(matchLocalizedPathname("/nl/rackets/padel/adidas-metalbone-2026", "nl")).toEqual({
      pathname: "/rackets/[sport]/[product]",
      params: { sport: "padel", product: "adidas-metalbone-2026" },
    });
  });

  it("accepts the internal (rewritten) form", () =>
    expect(matchLocalizedPathname("/es/rackets/padel", "es")).toEqual({
      pathname: "/rackets/[sport]",
      params: { sport: "padel" },
    }));

  it("does not match another market's slugs or unknown paths", () => {
    expect(matchLocalizedPathname("/nl/raquetas/padel", "nl")).toBeNull();
    expect(matchLocalizedPathname("/es/rackets/padel", "nl")).toBeNull();
    expect(matchLocalizedPathname("/nl/styleguide", "nl")).toBeNull();
  });
});
