import { describe, expect, it } from "vitest";
import type { ProductOffer } from "./product";
import { effectiveShipping, shopRows } from "./shop-prices";

const offer = (
  id: string,
  price: number,
  shippingCost: number | null,
  stock: ProductOffer["stock"] = "in_stock",
  freeShippingFrom: number | null = null,
): ProductOffer => ({
  id,
  shop: { slug: id, name: id.toUpperCase(), freeShippingFrom },
  price,
  shippingCost,
  stock,
  deliveryDaysMin: 1,
  deliveryDaysMax: 2,
  checkedOn: null,
});

describe("effectiveShipping", () => {
  it("is free above the shop's threshold", () => {
    expect(effectiveShipping(offer("a", 120, 4.95, "in_stock", 100))).toBe(0);
    expect(effectiveShipping(offer("a", 80, 4.95, "in_stock", 100))).toBe(4.95);
    expect(effectiveShipping(offer("a", 80, null))).toBeNull();
  });
});

describe("shopRows", () => {
  const offers = [offer("a", 200, 0), offer("b", 195, 9.95), offer("c", 150, 0, "out_of_stock")];

  it("sorts by price, sold out last, and marks the best deal", () => {
    const rows = shopRows(offers, false);
    expect(rows.map((r) => r.offer.id)).toEqual(["b", "a", "c"]);
    expect(rows[0].isBest).toBe(true);
    expect(rows[1].diff).toBe(5);
    expect(rows[2].diff).toBeNull();
  });

  it("re-sorts on the total with shipping", () => {
    const rows = shopRows(offers, true);
    expect(rows.map((r) => r.offer.id)).toEqual(["a", "b", "c"]);
    expect(rows[0].total).toBe(200);
    expect(rows[1].total).toBe(204.95);
    expect(rows[1].diff).toBe(4.95);
  });

  it("has no best deal with only one shop", () => {
    expect(shopRows([offer("a", 200, 0)], true)[0].isBest).toBe(false);
  });
});
