import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { adtractionAdapter, awinAdapter, daisyconAdapter, getAdapter } from "../adapters";
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

describe("adtraction adapter", () => {
  const items = parseCsv(decodeFeed(fixture("adtraction-sample.csv")))
    .map((row) => adtractionAdapter.toItem(row))
    .filter((i) => i !== null);

  it("is used for the adtraction network", () => {
    expect(getAdapter("adtraction")).toBe(adtractionAdapter);
  });

  it("skips rows without a tracking link", () => expect(items).toHaveLength(2));

  it("maps the Adtraction columns and uses TrackingUrl as the affiliate link", () => {
    expect(items[0]).toEqual({
      externalId: "PX-1001",
      title: "Bullpadel Vertex 04 2026",
      brand: "Bullpadel",
      gtin: "8435541700012",
      category: "Padel > Padelrackets",
      price: 279.95,
      shippingCost: 0,
      stockStatus: "in_stock",
      deliveryDaysMin: 1,
      deliveryDaysMax: 2,
      productUrl: "https://www.padelxpert.nl/bullpadel-vertex-04-2026",
      affiliateUrl:
        "https://on.padelxpert.nl/t/t?a=1884003964&as=2127163100&t=2&tk=1&url=https://www.padelxpert.nl/bullpadel-vertex-04-2026",
      imageUrl: "https://img.example.com/vertex04.jpg",
    });
    expect(items[1]).toMatchObject({ gtin: null, shippingCost: 4.95, stockStatus: "out_of_stock" });
  });

  it("reads Google Shopping column names, without taking link as the affiliate link", () => {
    const csv = [
      "id,title,brand,gtin,product_type,price,availability,link,image_link,tracking_url",
      "G1,Nox AT10 Genius 2026,Nox,8436024000017,Padel > Rackets,299.95 EUR,in stock,https://shop.example/at10,https://img.example/at10.jpg,https://track.example/at10",
      "G2,Nox ML10 Pro Cup,Nox,,Padel > Rackets,199.95 EUR,in stock,https://shop.example/ml10,,",
    ].join("\n");
    const rows = parseCsv(csv).map((row) => adtractionAdapter.toItem(row));
    expect(rows[0]).toMatchObject({
      externalId: "G1",
      price: 299.95,
      stockStatus: "in_stock",
      productUrl: "https://shop.example/at10",
      affiliateUrl: "https://track.example/at10",
    });
    expect(rows[1]).toBeNull();
  });
});
