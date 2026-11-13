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

describe("matchItem with colours, players and kinds (RP-91)", () => {
  const products: CatalogProduct[] = [
    {
      id: "hack-05",
      brand: "Bullpadel",
      model: "Hack 05",
      modelYear: 2027,
      gtins: [],
      category: "rackets",
    },
    {
      id: "coello-pro",
      brand: "Head",
      model: "Coello Pro",
      modelYear: 2026,
      gtins: [],
      category: "rackets",
    },
    {
      id: "coello-team",
      brand: "Head",
      model: "Coello Team",
      modelYear: 2026,
      gtins: [],
      category: "rackets",
    },
    {
      id: "neuvortx-lime",
      brand: "Adidas",
      model: "Neuvortx Lime",
      modelYear: 2026,
      gtins: [],
      category: "rackets",
    },
    {
      id: "at10-bag",
      brand: "Nox",
      model: "AT10 Team",
      modelYear: null,
      gtins: [],
      category: "accessories",
      productType: "bags",
    },
    {
      id: "at10-racket",
      brand: "Nox",
      model: "AT10 Team",
      modelYear: null,
      gtins: [],
      category: "rackets",
    },
    {
      id: "base-backpack",
      brand: "Head",
      model: "Base Rugzak 17L",
      modelYear: 2026,
      gtins: [],
      category: "accessories",
      productType: "bags",
    },
  ];
  const racket = { category: "rackets", productType: null } as const;
  const bag = { category: "accessories", productType: "bags" } as const;

  it("ignores a player's name the product does not have", () => {
    const r = matchItem(
      item("BULLPADEL HACK 05 2027 PAQUITO NAVARRO (Racket)"),
      products,
      undefined,
      racket,
    );
    expect(r).toMatchObject({ status: "matched", productId: "hack-05" });
  });

  it("keeps a player's name that is part of the model", () => {
    const r = matchItem(
      item("Head COELLO PRO 2026 Arturo Coello (Racket)"),
      products,
      undefined,
      racket,
    );
    expect(r).toMatchObject({ status: "matched", productId: "coello-pro" });
  });

  it("ignores colours, but not a colour the product name has", () => {
    expect(
      matchItem(item("Nox AT10 Team Grey/Orange (Racket Bag)"), products, undefined, bag),
    ).toMatchObject({
      status: "matched",
      productId: "at10-bag",
    });
    expect(matchItem(item("Adidas Neuvortx Blue 2026"), products, undefined, racket).status).toBe(
      "pending",
    );
  });

  it("never matches a bag to a racket of the same series", () => {
    expect(matchItem(item("Nox AT10 Team (Racket Bag)"), products, undefined, bag)).toMatchObject({
      productId: "at10-bag",
    });
    expect(matchItem(item("Nox AT10 Team Racket"), products, undefined, racket)).toMatchObject({
      productId: "at10-racket",
    });
  });

  it("reads rugzak and backpack as the same word, and skips product codes", () => {
    const r = matchItem(item("Head BASE Backpack 17L 2026 HB-12345"), products, undefined, bag);
    expect(r).toMatchObject({ status: "matched", productId: "base-backpack" });
  });
});
