import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { awinAdapter, daisyconAdapter } from "../adapters";
import { decodeFeed, detectDelimiter, parseCsv } from "../csv";

const fixture = (name: string) => readFileSync(new URL(`../__fixtures__/${name}`, import.meta.url));

describe("csv", () => {
  it("detects comma and semicolon delimiters", () => {
    expect(detectDelimiter("a,b,c\n1,2,3")).toBe(",");
    expect(detectDelimiter("a;b;c\n1;2;3")).toBe(";");
  });

  it("reads gzipped feeds transparently", () => {
    const raw = fixture("awin-sample.csv");
    expect(decodeFeed(gzipSync(raw))).toBe(decodeFeed(raw));
  });
});

describe("awin adapter", () => {
  const items = parseCsv(decodeFeed(fixture("awin-sample.csv")))
    .map((row) => awinAdapter.toItem(row))
    .filter((i) => i !== null);

  it("skips rows without an affiliate link", () => expect(items).toHaveLength(6));

  it("maps the standard Awin columns", () => {
    expect(items[0]).toEqual({
      externalId: "1001",
      title: "Adidas Metalbone 2026 Padel Racket",
      brand: "Adidas",
      gtin: "4066000000017",
      category: "Padel > Rackets",
      price: 289.95,
      shippingCost: 0,
      stockStatus: "in_stock",
      deliveryDaysMin: 1,
      deliveryDaysMax: 2,
      productUrl: "https://www.padel-point.nl/adidas-metalbone-2026",
      affiliateUrl: "https://www.awin1.com/pclick.php?p=1001&a=3144483&m=1",
      imageUrl: "https://img.example.com/mb26.jpg",
    });
  });

  it("derives low stock and out of stock from the quantity", () => {
    expect(items[1]?.stockStatus).toBe("low_stock");
    expect(items[3]?.stockStatus).toBe("out_of_stock");
  });
});

describe("daisycon adapter", () => {
  const items = parseCsv(decodeFeed(fixture("daisycon-sample.csv")))
    .map((row) => daisyconAdapter.toItem(row))
    .filter((i) => i !== null);

  it("parses a semicolon feed with Dutch prices", () => {
    expect(items).toHaveLength(5);
    expect(items[0]).toMatchObject({
      externalId: "d-501",
      title: "Kuikma Carbon 26 Control padelracket",
      price: 89.99,
      shippingCost: 0,
      stockStatus: "in_stock",
      deliveryDaysMin: 1,
      deliveryDaysMax: 3,
    });
    expect(items[3]).toMatchObject({
      price: 96.74,
      shippingCost: 4.95,
      stockStatus: "out_of_stock",
    });
  });
});
