import type { Metadata } from "next";
import { getAlternates } from "@/i18n/alternates";
import type { Locale } from "@/i18n/routing";
import { isIndexable, parseFilters } from "./racket-filters";
import { sportSlug, type SportKey } from "./taxonomy";

type Params = Record<string, string | string[] | undefined>;

/**
 * Canonical and robots for the overview: the sport page and sport + one brand are
 * indexable (canonical to themselves); every other filter combination is noindex with
 * the canonical pointing to the unfiltered page. The site-wide pre-launch noindex from
 * the layout still applies to indexable pages until RP-34.
 */
export function listingSeo(locale: Locale, sport: SportKey | null, params: Params): Metadata {
  const filters = parseFilters(params);
  const alternates = sport
    ? getAlternates(
        (l) => ({ pathname: "/rackets/[sport]", params: { sport: sportSlug(sport, l) } }),
        locale,
      )
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
  return { alternates };
}
