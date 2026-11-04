import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  applyFilters,
  EMPTY_FILTERS,
  facetCounts,
  filtersToQuery,
  isIndexable,
  parseFilters,
  priceBucket,
  switchCount,
  toggleValue,
  weightClass,
  type RacketItem,
} from "../racket-filters";

const item = (over: Partial<RacketItem>): RacketItem => ({
  id: "x",
  href: "/",
  name: "X",
  brand: { slug: "adidas", name: "Adidas" },
  sport: "padel",
  imageUrl: null,
  price: 100,
  compareAt: null,
  discount: null,
  shopCount: 2,
  inStock: true,
  checkedOn: null,
  levels: ["beginner"],
  style: "controle",
  weight: 350,
  ...over,
});

const items = [
  item({
    id: "a",
    brand: { slug: "adidas", name: "Adidas" },
    price: 60,
    levels: ["beginner"],
    style: "controle",
    weight: 350,
  }),
  item({
    id: "b",
    brand: { slug: "adidas", name: "Adidas" },
    price: 280,
    levels: ["gevorderd", "competitie"],
    style: "power",
    weight: 368,
    discount: 17,
    compareAt: 337,
  }),
  item({
    id: "c",
    brand: { slug: "kuikma", name: "Kuikma" },
    price: 99,
    levels: ["gemiddeld", "gevorderd"],
    style: "allround",
    weight: 365,
    inStock: false,
  }),
  item({
    id: "d",
    brand: { slug: "kuikma", name: "Kuikma" },
    price: 116,
    levels: ["gevorderd"],
    style: "power",
    weight: 370,
  }),
];

describe("classes", () => {
  it("buckets prices", () => {
    expect(priceBucket(74.99)).toBe("tot-75");
    expect(priceBucket(75)).toBe("75-150");
    expect(priceBucket(250)).toBe("250-plus");
    expect(priceBucket(null)).toBeNull();
  });
  it("classes padel weights", () => {
    expect(weightClass("padel", 354)).toBe("licht");
    expect(weightClass("padel", 365)).toBe("gemiddeld");
    expect(weightClass("padel", 366)).toBe("zwaar");
    expect(weightClass("table-tennis", 90)).toBeNull();
  });
});

describe("URL state", () => {
  it("parses, drops unknown values and round-trips", () => {
    const f = parseFilters({
      merk: "kuikma,Adidas",
      niveau: ["gevorderd", "nope"],
      deals: "1",
      uitverkocht: "verberg",
      x: "1",
    });
    expect(f).toEqual({
      ...EMPTY_FILTERS,
      merk: ["adidas", "kuikma"],
      niveau: ["gevorderd"],
      deals: true,
      hideSoldOut: true,
    });
    expect(filtersToQuery(f)).toBe(
      "?merk=adidas,kuikma&niveau=gevorderd&deals=1&uitverkocht=verberg",
    );
    expect(parseFilters(Object.fromEntries(new URLSearchParams(filtersToQuery(f))))).toEqual(f);
    expect(filtersToQuery(EMPTY_FILTERS)).toBe("");
  });
  it("rejects odd brand slugs", () => expect(parseFilters({ merk: "<script>" }).merk).toEqual([]));
  it("toggles values", () => {
    const f = toggleValue(EMPTY_FILTERS, "merk", "kuikma");
    expect(f.merk).toEqual(["kuikma"]);
    expect(toggleValue(f, "merk", "kuikma").merk).toEqual([]);
  });
});

describe("filtering", () => {
  it("ORs within a facet, ANDs across facets, sold out last", () => {
    const f = {
      ...EMPTY_FILTERS,
      niveau: ["gevorderd" as const],
      stijl: ["allround" as const, "power" as const],
    };
    expect(applyFilters(items, f).map((i) => i.id)).toEqual(["b", "d", "c"]);
  });
  it("deals and hide sold out", () => {
    expect(applyFilters(items, { ...EMPTY_FILTERS, deals: true }).map((i) => i.id)).toEqual(["b"]);
    expect(applyFilters(items, { ...EMPTY_FILTERS, hideSoldOut: true }).map((i) => i.id)).toEqual([
      "a",
      "b",
      "d",
    ]);
    expect(switchCount(items, EMPTY_FILTERS, "hideSoldOut")).toBe(3);
  });
  it("counts options without the facet's own filter", () => {
    const f = { ...EMPTY_FILTERS, merk: ["kuikma"] };
    expect(Object.fromEntries(facetCounts(items, f, "merk"))).toEqual({ adidas: 2, kuikma: 2 });
    expect(Object.fromEntries(facetCounts(items, f, "stijl"))).toEqual({ allround: 1, power: 1 });
    // The count of an option equals the result count when it is the only choice.
    const counts = facetCounts(items, f, "niveau");
    for (const [level, n] of counts) {
      expect(applyFilters(items, { ...f, niveau: [level as "gevorderd"] })).toHaveLength(n);
    }
  });
});

describe("indexing", () => {
  it("indexes the sport page and sport + one brand only", () => {
    expect(isIndexable(EMPTY_FILTERS)).toBe(true);
    expect(isIndexable({ ...EMPTY_FILTERS, merk: ["adidas"] })).toBe(true);
    expect(isIndexable({ ...EMPTY_FILTERS, merk: ["adidas", "kuikma"] })).toBe(false);
    expect(isIndexable({ ...EMPTY_FILTERS, merk: ["adidas"], deals: true })).toBe(false);
    expect(activeFilterCount({ ...EMPTY_FILTERS, niveau: ["beginner"], deals: true })).toBe(2);
  });
});
