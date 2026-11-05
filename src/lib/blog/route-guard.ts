import { routing, type Locale } from "@/i18n/routing";
import { clearExistsCache, restRowExists, SLUG } from "@/lib/routing/exists";

/** Public blog segment per market, e.g. nl: "blog". */
function blogSegment(locale: Locale): string {
  const path = routing.pathnames["/blog"];
  return (typeof path === "string" ? path : path[locale]).split("/")[1]!;
}

/** { locale, slug } for /{locale}/{blog}/{slug} (without further segments), else null. */
export function articleFromPath(pathname: string): { locale: Locale; slug: string } | null {
  const parts = pathname.replace(/\/$/, "").split("/");
  if (parts.length !== 4) return null;
  const [, locale, segment, slug] = parts;
  if (!locale || !slug || !(routing.locales as readonly string[]).includes(locale)) return null;
  if (segment !== blogSegment(locale as Locale)) return null;
  return { locale: locale as Locale, slug: decodeURIComponent(slug) };
}

/** Whether a published article exists (RLS hides drafts and future dates). */
export async function articleExists(
  locale: Locale,
  slug: string,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
): Promise<boolean> {
  if (!SLUG.test(slug)) return false;
  return restRowExists(
    `articles?select=slug&market_code=eq.${locale}&slug=eq.${slug}&limit=1`,
    fetcher,
    now,
  );
}

/** For tests. */
export const clearArticleCache = clearExistsCache;
