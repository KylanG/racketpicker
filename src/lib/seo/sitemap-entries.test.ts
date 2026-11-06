import { describe, expect, it } from "vitest";
import { sitemapRoutes, type SitemapProduct } from "./sitemap-entries";

const product = (over: Partial<SitemapProduct> = {}): SitemapProduct => ({
  category: "rackets",
  sport: "padel",
  tier: "B",
  brand: "adidas",
  productType: null,
  slugs: { nl: "adidas-metalbone" },
  updatedAt: "2026-11-06T00:00:00Z",
  ...over,
});

describe("sitemapRoutes", () => {
  it("leaves Tier C products out but keeps their sport page", () => {
    const routes = sitemapRoutes([product({ tier: "C" })], []);
    expect(routes.some((r) => r.kind === "product")).toBe(false);
    expect(routes).toContainEqual({ kind: "listing", category: "rackets", sport: "padel" });
  });

  it("adds a brand page only from two products of that brand", () => {
    const one = sitemapRoutes([product()], []);
    expect(one.some((r) => r.kind === "listing" && r.query === "merk=adidas")).toBe(false);
    const two = sitemapRoutes([product(), product({ slugs: { nl: "adidas-adipower" } })], []);
    expect(two.some((r) => r.kind === "listing" && r.query === "merk=adidas")).toBe(true);
  });

  it("adds accessory type pages and advisor outcomes only for sports with rackets", () => {
    const routes = sitemapRoutes(
      [product({ category: "accessories", productType: "balls", tier: "C" })],
      ["beginner-controle"],
    );
    expect(routes).toContainEqual({
      kind: "listing",
      category: "accessories",
      sport: "padel",
      query: "soort=ballen",
    });
    expect(routes.some((r) => r.kind === "advisor")).toBe(false);
    const withRacket = sitemapRoutes([product()], ["beginner-controle"]);
    expect(withRacket).toContainEqual({
      kind: "advisor",
      sport: "padel",
      profile: "beginner-controle",
    });
  });
});
