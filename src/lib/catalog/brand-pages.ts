import "server-only";
import type { Locale } from "@/i18n/routing";
import { getCatalogOverview } from "./overview";
import type { OverviewBrand } from "./overview-rows";
import type { RacketItem } from "./racket-filters";
import { getCatalogListing } from "./rackets";

export type BrandPage = {
  brand: OverviewBrand;
  items: RacketItem[];
  rackets: number;
  accessories: number;
  minPrice: number | null;
  maxPrice: number | null;
};

/** Brands with published products, most products first (RP-55). */
export async function getBrands(): Promise<OverviewBrand[]> {
  return (await getCatalogOverview()).brands;
}

/**
 * Everything of one brand for its page: rackets first, then accessories, each in the
 * overview's order. Null for a brand without products (the proxy already gives a 404).
 */
export async function getBrandPage(locale: Locale, slug: string): Promise<BrandPage | null> {
  const [brands, rackets, accessories] = await Promise.all([
    getBrands(),
    getCatalogListing(locale, "rackets"),
    getCatalogListing(locale, "accessories"),
  ]);
  const brand = brands.find((b) => b.slug === slug);
  if (!brand) return null;
  const ownRackets = rackets.filter((i) => i.brand.slug === slug);
  const ownAccessories = accessories.filter((i) => i.brand.slug === slug);
  const items = [...ownRackets, ...ownAccessories];
  const prices = items.flatMap((i) => (i.price != null ? [i.price] : []));
  return {
    brand,
    items,
    rackets: ownRackets.length,
    accessories: ownAccessories.length,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
  };
}
