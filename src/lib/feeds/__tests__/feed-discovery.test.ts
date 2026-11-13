import { describe, expect, it } from "vitest";
import {
  cleanFeedTitle,
  knownBrand,
  selectFeedProducts,
  type KnownCatalog,
} from "../feed-discovery";
import type { PreparedItem } from "../pipeline";

// Valid EAN-13s (check digit included).
const EAN = ["8435778902621", "8435778902638", "4006381333931", "5901234123457", "4012345678901"];

const racket = { category: "rackets", productType: null } as const;
const bag = { category: "accessories", productType: "bags" } as const;

const item = (title: string, extra: Partial<PreparedItem> = {}): PreparedItem => ({
  externalId: title,
  title,
  brand: null,
  gtin: EAN[0]!,
  category: null,
  price: 199.95,
  shippingCost: null,
  stockStatus: "in_stock",
  deliveryDaysMin: null,
  deliveryDaysMax: null,
  productUrl: null,
  affiliateUrl: "https://www.awin1.com/pclick.php?p=1",
  imageUrl: null,
  match: { status: "pending", suggestedProductId: null, score: null },
  kind: racket,
  ...extra,
});

const empty = (): KnownCatalog => ({
  eans: new Set(),
  keys: new Set(),
  slugs: new Set(),
  years: new Map(),
});

describe("cleanFeedTitle", () => {
  it("drops players, codes and colours, keeps the backpack", () => {
    expect(cleanFeedTitle("NOX GENIUS 18K 2027 by AGUSTIN TAPIA (Racket)")).toBe(
      "NOX GENIUS 18K 2027 (Racket)",
    );
    expect(cleanFeedTitle("Bullpadel BPM-26001 Hack Black 2026 Paquito Navarro (Backpack)")).toBe(
      "Bullpadel Hack 2026 Backpack",
    );
    expect(cleanFeedTitle("Nox AT10 Team Grey/Orange 2024 (Racket Bag)")).toBe(
      "Nox AT10 Team 2024 (Racket Bag)",
    );
  });
});

describe("knownBrand", () => {
  it("uses the feed's brand column in our spelling", () => {
    expect(knownBrand("BULLPADEL", "whatever")).toBe("Bullpadel");
    expect(knownBrand("Drop Shot", "x")).toBe("Drop Shot");
    expect(knownBrand(null, "Kombat Teide 2025 padel racket")).toBe("Kombat");
    expect(knownBrand("Acme", "Acme Super Racket")).toBeNull();
  });
});

describe("selectFeedProducts", () => {
  it("creates a racket without players or shop words in its name", () => {
    const [p] = selectFeedProducts(
      [item("BULLPADEL HACK 05 2027 PAQUITO NAVARRO (Racket)", { brand: "Bullpadel" })],
      empty(),
    );
    expect(p).toMatchObject({
      brand: "Bullpadel",
      model: "Hack 05",
      year: 2027,
      title: "Bullpadel Hack 05 2027",
      slug: "bullpadel-hack-05-2027",
      category: "rackets",
      productType: null,
    });
  });

  it("names a bag without the racket word", () => {
    const [p] = selectFeedProducts(
      [item("Wilson Tour Racket Bag 2025", { brand: "Wilson", kind: bag, price: 49.95 })],
      empty(),
    );
    expect(p).toMatchObject({
      title: "Wilson Tour 2025",
      category: "accessories",
      productType: "bags",
    });
  });

  it("makes one product of colour variants", () => {
    const picked = selectFeedProducts(
      [
        item("Head Bolt Red/Black 2026 (Racket)", { gtin: EAN[0] }),
        item("Head BOLT White/Grey 2026 (Racket)", { gtin: EAN[1] }),
      ],
      empty(),
    );
    expect(picked.map((p) => p.title)).toEqual(["Head Bolt 2026"]);
  });

  it("leaves doubts in the review queue, but not another model year", () => {
    const known = empty();
    known.years.set("vertex-26", 2026).set("neuron", null);
    const doubt = { status: "pending", suggestedProductId: "neuron", score: 0.68 } as const;
    const lastYear = { status: "pending", suggestedProductId: "vertex-26", score: 0.5 } as const;
    const picked = selectFeedProducts(
      [
        item("Bullpadel Neuron 02 2027", { match: doubt, gtin: EAN[0] }),
        item("Bullpadel Vertex 05 2027", { match: lastYear, gtin: EAN[1] }),
      ],
      known,
    );
    expect(picked.map((p) => p.title)).toEqual(["Bullpadel Vertex 05 2027"]);
  });

  it("skips matched, unknown brands, invalid EANs, out of stock, cheap and known items", () => {
    const known = empty();
    known.eans.add(EAN[4]!);
    known.keys.add("Nox|ventus|2027|rackets");
    const picked = selectFeedProducts(
      [
        item("Adidas Metalbone 2026", {
          match: { status: "matched", method: "gtin", productId: "x", score: 1 },
        }),
        item("Acme Super 2026"),
        item("Head Speed 2026", { gtin: "1234567890123" }),
        item("Head Speed 2026", { gtin: EAN[1], stockStatus: "out_of_stock" }),
        item("Head Speed 2026", { gtin: EAN[2], price: 19.95 }),
        item("Head Speed Pro 2026", { gtin: EAN[4] }),
        item("Nox Ventus 2027", { gtin: EAN[3] }),
        item("Head Speed 2026", { gtin: EAN[3], kind: null }),
      ],
      known,
    );
    expect(picked).toEqual([]);
  });

  it("gives a second product with a taken slug the end of its EAN", () => {
    const known = empty();
    known.slugs.add("bullpadel-pearl-2027");
    const [p] = selectFeedProducts(
      [item("Bullpadel Pearl 2027 (Racket Bag)", { kind: bag })],
      known,
    );
    expect(p?.slug).toBe(`bullpadel-pearl-2027-${EAN[0]!.slice(-4)}`);
  });
});
