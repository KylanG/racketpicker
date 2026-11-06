import type { Metadata } from "next";
import { getAlternates } from "@/i18n/alternates";
import type { Locale } from "@/i18n/routing";
import { isIndexable, parseFilters } from "./racket-filters";
import { getCatalogListing } from "./rackets";
import { sportSlug, type SportKey } from "./taxonomy";

type Params = Record<string, string | string[] | undefined>;

/**
 * Canonical and robots for an overview: the sport page, sport + one brand and (accessories)
 * sport + one type are
 * indexable (canonical to themselves); every other filter combination is noindex with
 * the canonical pointing to the unfiltered page. The site-wide pre-launch noindex from
 * the layout still applies to indexable pages until RP-34.
 */
export function listingSeo(
  locale: Locale,
  sport: SportKey | null,
  params: Params,
  category: "rackets" | "accessories" = "rackets",
): Metadata {
  const filters = parseFilters(params);
  const pathname = category === "rackets" ? "/rackets/[sport]" : "/accessories/[sport]";
  const alternates = sport
    ? getAlternates((l) => ({ pathname, params: { sport: sportSlug(sport, l) } }), locale)
    : getAlternates("/rackets", locale);

  if (!isIndexable(filters)) {
    return { alternates, robots: { index: false, follow: true } };
  }
  if (filters.merk.length === 1 && alternates?.canonical) {
    const brand = encodeURIComponent(filters.merk[0]!);
    return {
      alternates: { ...alternates, canonical: `${String(alternates.canonical)}?merk=${brand}` },
    };
  }
  if (filters.soort.length === 1 && alternates?.canonical) {
    return {
      alternates: {
        ...alternates,
        canonical: `${String(alternates.canonical)}?soort=${filters.soort[0]}`,
      },
    };
  }
  return { alternates };
}

/**
 * The brand a listing is filtered on, when exactly one brand is selected (the indexable
 * sport + brand page), for its title. Null for an unknown brand or any other filter.
 */
export async function listingBrand(
  locale: Locale,
  category: "rackets" | "accessories",
  params: Params,
): Promise<string | null> {
  const { merk } = parseFilters(params);
  if (merk.length !== 1) return null;
  const items = await getCatalogListing(locale, category);
  return items.find((i) => i.brand.slug === merk[0])?.brand.name ?? null;
}
