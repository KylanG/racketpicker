import { describe, expect, it } from "vitest";
import { menuBrands } from "../menu-brands";
import type { RacketItem } from "../racket-filters";

const item = (id: string, brand: string, shopCount = 1, inStock = true): RacketItem => ({
  id,
  href: `/nl/rackets/padel/${id}`,
  name: `${brand} ${id}`,
  brand: { slug: brand.toLowerCase(), name: brand },
  sport: "padel",
  imageUrl: null,
  price: 100,
  compareAt: null,
  discount: null,
  shopCount,
  inStock,
  checkedOn: null,
  levels: [],
  style: null,
  weight: null,
});

describe("menuBrands", () => {
  it("orders brands by product count and models by coverage, without the brand name", () => {
    const result = menuBrands(
      [
        item("a1", "Adidas"),
        item("n1", "Nox", 1),
        item("n2", "Nox", 4),
        item("n3", "Nox", 9, false),
        item("b1", "Babolat"),
      ],
      2,
      2,
    );
    expect(result).toEqual([
      {
        slug: "nox",
        name: "Nox",
        count: 3,
        items: [
          { label: "n2", href: "/nl/rackets/padel/n2" },
          { label: "n1", href: "/nl/rackets/padel/n1" },
        ],
      },
      {
        slug: "adidas",
        name: "Adidas",
        count: 1,
        items: [{ label: "a1", href: "/nl/rackets/padel/a1" }],
      },
    ]);
  });
});
