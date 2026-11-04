import { describe, expect, it } from "vitest";
import { catalogOverviewFromRows } from "../overview-rows";

type Brand = { slug: string; name: string; logo_path: string | null };
const adidas: Brand = { slug: "adidas", name: "Adidas", logo_path: null };
const kuikma: Brand = { slug: "kuikma", name: "Kuikma", logo_path: "brands/kuikma.svg" };
const row = (sport: string | null, category: string, brands: Brand | null = adidas) => ({
  sport_key: sport,
  category_key: category,
  brands,
});

describe("catalogOverviewFromRows", () => {
  const overview = catalogOverviewFromRows([
    row("tennis", "rackets"),
    row("padel", "rackets"),
    row("padel", "rackets", kuikma),
    row("padel", "rackets", kuikma),
    row("padel", "shoes", kuikma),
    row("curling", "rackets"),
    row(null, "rackets"),
  ]);

  it("counts products per sport in taxonomy order, ignoring unknown sports", () =>
    expect(overview.sports).toEqual([
      { key: "padel", count: 4 },
      { key: "tennis", count: 1 },
    ]));

  it("lists categories with the sports they cover", () =>
    expect(overview.categories).toEqual([
      { key: "rackets", count: 4, sports: ["padel", "tennis"] },
      { key: "shoes", count: 1, sports: ["padel"] },
    ]));

  it("lists brands, most products first, with their main sport", () =>
    expect(overview.brands).toEqual([
      {
        slug: "kuikma",
        name: "Kuikma",
        logoPath: "brands/kuikma.svg",
        sport: "padel",
        productCount: 3,
      },
      { slug: "adidas", name: "Adidas", logoPath: null, sport: "padel", productCount: 2 },
    ]));

  it("is empty without rows", () =>
    expect(catalogOverviewFromRows([])).toEqual({ sports: [], categories: [], brands: [] }));
});
