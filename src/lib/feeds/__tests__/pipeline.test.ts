import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { looksTruncated, prepareFeed, toIngestRow } from "../pipeline";
import type { CatalogProduct } from "../types";

const fixture = (name: string) =>
  new Uint8Array(readFileSync(new URL(`../__fixtures__/${name}`, import.meta.url)));

const catalog: CatalogProduct[] = [
  {
    id: "metalbone-26",
    brand: "Adidas",
    model: "Metalbone",
    modelYear: 2026,
    gtins: ["4066000000017"],
  },
  { id: "drive-26", brand: "Adidas", model: "Drive", modelYear: 2026, gtins: [] },
  { id: "neuvortx-26", brand: "Adidas", model: "Neuvortx Lime", modelYear: 2026, gtins: [] },
  { id: "kuikma-control", brand: "Kuikma", model: "Carbon 26 Control", modelYear: 2026, gtins: [] },
];

describe("prepareFeed", () => {
  it("runs an Awin feed through parse → filter → match", () => {
    const { items, stats } = prepareFeed(
      fixture("awin-sample.csv"),
      "awin",
      "padel_rackets",
      catalog,
    );
    expect(stats).toMatchObject({
      rows: 7,
      invalid: 1, // row without link
      filteredOut: 1, // overgrip
      kept: 5,
      matchedByGtin: 1, // Metalbone 2026
    });
    expect(items.map((i) => i.externalId)).toEqual(["1001", "1002", "1003", "1004", "1006"]);
  });

  it("filters a general sports shop down to padel rackets", () => {
    const { items, stats } = prepareFeed(
      fixture("daisycon-sample.csv"),
      "daisycon",
      "padel_rackets",
      catalog,
    );
    expect(items.map((i) => i.externalId)).toEqual(["d-501", "d-504"]);
    expect(stats.filteredOut).toBe(3); // shoe, running shoe, bag
    expect(stats.matchedByName).toBe(1); // Neuvortx Lime 2026
    expect(items[0]?.match).toMatchObject({
      status: "pending",
      suggestedProductId: "kuikma-control",
    });
  });

  it("keeps everything with filter 'all'", () => {
    const { stats } = prepareFeed(fixture("daisycon-sample.csv"), "daisycon", "all", catalog);
    expect(stats.kept).toBe(5);
  });
});

describe("toIngestRow", () => {
  it("maps a matched item to the database shape", () => {
    const { items } = prepareFeed(fixture("awin-sample.csv"), "awin", "padel_rackets", catalog);
    expect(toIngestRow(items[0]!)).toMatchObject({
      external_id: "1001",
      match_status: "matched",
      match_method: "gtin",
      matched_product_id: "metalbone-26",
      suggested_product_id: null,
      price: 289.95,
      stock_status: "in_stock",
    });
  });
});

describe("looksTruncated", () => {
  it("flags a feed that shrank by more than half", () =>
    expect(looksTruncated(100, 40)).toBe(true));
  it("accepts normal fluctuation", () => expect(looksTruncated(100, 80)).toBe(false));
  it("ignores small shops", () => expect(looksTruncated(10, 1)).toBe(false));
});
