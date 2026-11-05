import { describe, expect, it } from "vitest";
import type { PriceStats } from "./pricing";
import type { ProductOffer } from "./product";
import { summarizePrices } from "./product-price";

const offer = (
  slug: string,
  price: number,
  stock: ProductOffer["stock"] = "in_stock",
): ProductOffer => ({
  id: `${slug}-id`,
  shop: { slug, name: slug, freeShippingFrom: null },
  price,
  shippingCost: null,
  stock,
  deliveryDaysMin: null,
  deliveryDaysMax: null,
  checkedOn: null,
});

const stats = (over: Partial<PriceStats> = {}): PriceStats => ({
  currentPrice: 150,
  reducedSince: null,
  priorPrice: null,
  lowest90d: 150,
  avg90d: 160,
  highest90d: 170,
  firstRecordedOn: "2026-11-05",
  msrp: null,
  ...over,
});

const today = new Date("2026-11-05T12:00:00Z");

describe("summarizePrices", () => {
  it("normal: cheapest available offer and the spread to the most expensive", () => {
    const s = summarizePrices(
      [offer("b", 170), offer("a", 150), offer("c", 140, "out_of_stock")],
      stats(),
      today,
    );
    expect(s.state).toBe("normal");
    expect(s.best?.shop.slug).toBe("a");
    expect(s.saveShops).toBe(20);
    expect(s.availableCount).toBe(2);
    expect(s.shopCount).toBe(3);
  });

  it("single shop", () => {
    const s = summarizePrices([offer("a", 150), offer("b", 120, "out_of_stock")], stats(), today);
    expect(s.state).toBe("single");
    expect(s.saveShops).toBeNull();
  });

  it("sold out: no comparison price and no lowest label", () => {
    const s = summarizePrices([offer("a", 150, "out_of_stock")], stats({ lowest90d: 150 }), today);
    expect(s.state).toBe("soldOut");
    expect(s.best?.price).toBe(150);
    expect(s.compareAt).toBeNull();
    expect(s.lowestIn90Days).toBe(false);
  });

  it("no price", () => {
    expect(summarizePrices([], null, today)).toMatchObject({ state: "noPrice", best: null });
  });

  it("without 30 days of history there is no comparison price", () => {
    const s = summarizePrices(
      [offer("a", 150), offer("b", 160)],
      stats({ reducedSince: "2026-11-05", priorPrice: 180, firstRecordedOn: "2026-11-01" }),
      today,
    );
    expect(s.compareAt).toBeNull();
    expect(s.discount).toBeNull();
  });

  it("shows the Omnibus comparison price and the MSRP saving with enough history", () => {
    const s = summarizePrices(
      [offer("a", 150), offer("b", 160)],
      stats({
        reducedSince: "2026-11-01",
        priorPrice: 180,
        firstRecordedOn: "2026-07-01",
        lowest90d: 150,
        msrp: 250,
      }),
      today,
    );
    expect(s.compareAt).toBe(180);
    expect(s.discount).toBe(17);
    expect(s.lowestIn90Days).toBe(true);
    expect(s.saveMsrp).toBe(100);
  });

  it("ignores statistics that do not match the cheapest offer", () => {
    const s = summarizePrices(
      [offer("a", 150)],
      stats({
        currentPrice: 140,
        reducedSince: "2026-11-01",
        priorPrice: 180,
        firstRecordedOn: "2026-07-01",
      }),
      today,
    );
    expect(s.compareAt).toBeNull();
    expect(s.lowestIn90Days).toBe(false);
  });
});
