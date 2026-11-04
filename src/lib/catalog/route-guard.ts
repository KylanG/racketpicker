import { routing, type Locale } from "@/i18n/routing";
import { sportFromSlug } from "./taxonomy";

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
