import { routing, type Locale } from "@/i18n/routing";
import { restRowExists, SLUG } from "@/lib/routing/exists";
import { sportFromSlug, type SportKey } from "./taxonomy";

/** First path segment of every category route per market, e.g. nl: rackets, schoenen … */
const CATEGORY_SEGMENTS: Record<string, Set<string>> = (() => {
  const result: Record<string, Set<string>> = {};
  for (const locale of routing.locales) result[locale] = new Set();
  for (const [internal, external] of Object.entries(routing.pathnames)) {
    if (!internal.endsWith("/[sport]") && !internal.includes("/[sport]/")) continue;
    for (const locale of routing.locales) {
      const path = typeof external === "string" ? external : external[locale];
      const segment = path.split("/")[1];
      if (segment) result[locale]!.add(segment);
    }
  }
  return result;
})();

/**
 * True for /{locale}/{category}/{sport}… URLs with an unknown sport slug.
 * The proxy turns these into a real 404 before rendering: with Cache Components a
 * notFound() inside the page would be streamed with status 200.
 */
export function hasUnknownSport(pathname: string): boolean {
  const [, locale, category, sport] = pathname.split("/");
  if (!locale || !category || !sport) return false;
  if (!(routing.locales as readonly string[]).includes(locale)) return false;
  if (!CATEGORY_SEGMENTS[locale]?.has(category)) return false;
  return sportFromSlug(decodeURIComponent(sport), locale as Locale) === null;
}

/** { locale, sport, slug } for /{locale}/{rackets}/{sport}/{product}, else null. */
export function racketFromPath(
  pathname: string,
): { locale: Locale; sport: SportKey; slug: string } | null {
  const parts = pathname.replace(/\/$/, "").split("/");
  if (parts.length !== 5) return null;
  const [, locale, segment, sportSlugPart, slug] = parts;
  if (!locale || !sportSlugPart || !slug) return null;
  if (!(routing.locales as readonly string[]).includes(locale)) return null;
  const route = routing.pathnames["/rackets/[sport]/[product]"];
  const expected = (typeof route === "string" ? route : route[locale as Locale]).split("/")[1];
  if (segment !== expected) return null;
  const sport = sportFromSlug(decodeURIComponent(sportSlugPart), locale as Locale);
  if (!sport) return null;
  return { locale: locale as Locale, sport, slug: decodeURIComponent(slug) };
}

/**
 * Whether a published racket with this slug exists for the sport (RLS hides unpublished
 * products). Sample products only count where sample data is shown.
 */
export async function racketExists(
  r: { locale: Locale; sport: SportKey; slug: string },
  fetcher: typeof fetch = fetch,
  now = Date.now(),
): Promise<boolean> {
  if (!SLUG.test(r.slug)) return false;
  const samples =
    process.env.NEXT_PUBLIC_SHOW_SAMPLE_DATA === "true" ? "" : "&products.is_sample=eq.false";
  return restRowExists(
    `product_content?select=slug,products!inner(id)&market_code=eq.${r.locale}&slug=eq.${r.slug}` +
      `&is_published=eq.true&products.sport_key=eq.${r.sport}&products.category_key=eq.rackets` +
      `&products.status=eq.published${samples}&limit=1`,
    fetcher,
    now,
  );
}
