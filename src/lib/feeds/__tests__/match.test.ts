import { describe, expect, it } from "vitest";
import { matchItem, scoreName } from "../match";
import type { CatalogProduct, NormalizedFeedItem } from "../types";

const catalog: CatalogProduct[] = [
  { id: "metalbone-26", brand: "Adidas", model: "Metalbone", modelYear: 2026, gtins: [] },
  { id: "metalbone-hrd-26", brand: "Adidas", model: "Metalbone HRD+", modelYear: 2026, gtins: [] },
  { id: "drive-26", brand: "Adidas", model: "Drive", modelYear: 2026, gtins: [] },
  {
    id: "neuvortx-26",
    brand: "Adidas",
    model: "Neuvortx Lime",
    modelYear: 2026,
    gtins: ["4066000000062"],
  },
  { id: "kuikma-control", brand: "Kuikma", model: "Carbon 26 Control", modelYear: 2026, gtins: [] },
  { id: "kuikma-power", brand: "Kuikma", model: "Carbon 26 Power", modelYear: 2026, gtins: [] },
];

const item = (title: string, extra: Partial<NormalizedFeedItem> = {}): NormalizedFeedItem => ({
  externalId: "x",
  title,
  brand: null,
  gtin: null,
  category: null,
  price: 100,
  shippingCost: null,
  stockStatus: "in_stock",
  deliveryDaysMin: null,
  deliveryDaysMax: null,
  productUrl: null,
  affiliateUrl: "https://example.com",
  imageUrl: null,
  ...extra,
});

describe("matchItem", () => {
  it("matches on GTIN first, whatever the title says", () => {
    expect(matchItem(item("Totally different title", { gtin: "4066000000062" }), catalog)).toEqual({
      status: "matched",
      method: "gtin",
      productId: "neuvortx-26",
      score: 1,
    });
  });

  it("matches an exact model and year by name", () => {
    const result = matchItem(
      item("Adidas Metalbone 2026 Padel Racket", { brand: "Adidas" }),
      catalog,
    );
    expect(result).toMatchObject({ status: "matched", method: "name", productId: "metalbone-26" });
  });

  it("does not confuse Metalbone with Metalbone HRD+", () => {
    const result = matchItem(item("Adidas Metalbone HRD+ 2026", { brand: "Adidas" }), catalog);
    expect(result).toMatchObject({ status: "matched", productId: "metalbone-hrd-26" });
  });

  it("sends a different model year to review instead of matching", () => {
    const result = matchItem(item("Adidas Drive 2025 Padel Racket", { brand: "Adidas" }), catalog);
    expect(result.status).toBe("pending");
  });

  it("suggests, but does not auto-match, when the year is missing", () => {
    const result = matchItem(item("Adidas Drive Padelracket", { brand: "Adidas" }), catalog);
    expect(result).toMatchObject({ status: "pending", suggestedProductId: "drive-26" });
  });

  it("keeps Kuikma Control and Power apart", () => {
    expect(
      matchItem(item("Kuikma Carbon 26 Control padelracket 2026", { brand: "Kuikma" }), catalog),
    ).toMatchObject({ status: "matched", productId: "kuikma-control" });
  });

  it("finds the brand in the title when the brand column is empty", () => {
    expect(scoreName(item("Adidas Neuvortx Lime 2026"), catalog[3]!)).toBeGreaterThan(0.9);
  });

  it("returns no suggestion for unknown products", () => {
    expect(matchItem(item("Bullpadel Vertex 04 2026", { brand: "Bullpadel" }), catalog)).toEqual({
      status: "pending",
      suggestedProductId: null,
      score: 0,
    });
  });
});
