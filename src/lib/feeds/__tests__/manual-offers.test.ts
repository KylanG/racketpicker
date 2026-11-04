import { describe, expect, it } from "vitest";
import { MANUAL_OFFERS } from "@/data/manual-offers";
import { toRpcItems, validateManualOffers, type ManualOffer } from "../manual-offers";

const today = new Date("2026-11-04T12:00:00Z");
const offer = (over: Partial<ManualOffer> = {}): ManualOffer => ({
  shop: "padel-point",
  product: "adidas-metalbone-2026",
  price: 259.95,
  shipping: 0,
  stock: "in_stock",
  url: "https://www.padel-point.nl/metalbone",
  checkedOn: "2026-11-04",
  ...over,
});

describe("validateManualOffers", () => {
  it("accepts a valid list", () => expect(validateManualOffers([offer()], today)).toEqual([]));

  it("reports bad values", () => {
    const errors = validateManualOffers(
      [
        offer({ price: 0 }),
        offer({ product: "x", url: "http://insecure" }),
        offer({ product: "y", checkedOn: "2026-11-05" }),
        offer({ product: "z", checkedOn: "4-11-2026" }),
        offer({ product: "Bad Slug" }),
      ],
      today,
    );
    expect(errors).toHaveLength(5);
  });

  it("rejects duplicates of shop + product", () =>
    expect(validateManualOffers([offer(), offer({ price: 249 })], today)).toEqual([
      "#2 (padel-point/adidas-metalbone-2026): duplicate shop + product",
    ]));

  it("the checked-in list is valid", () => expect(validateManualOffers(MANUAL_OFFERS)).toEqual([]));
});

describe("toRpcItems", () => {
  it("maps to the SQL payload", () =>
    expect(toRpcItems([offer({ shipping: undefined })])[0]).toEqual({
      shop: "padel-point",
      product: "adidas-metalbone-2026",
      price: 259.95,
      shipping: null,
      stock: "in_stock",
      url: "https://www.padel-point.nl/metalbone",
      checked_on: "2026-11-04",
    }));
});
