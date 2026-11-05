import { routing, type Locale } from "@/i18n/routing";

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

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { exists: boolean; at: number }>();

/**
 * Whether a published article exists. Used by the proxy to answer unknown slugs with a
 * real 404: with Cache Components a notFound() during streaming would answer 200.
 * Fails open (true) when Supabase cannot be reached, so the page itself decides.
 */
export async function articleExists(
  locale: Locale,
  slug: string,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
): Promise<boolean> {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return false;
  const key = `${locale}/${slug}`;
  const hit = cache.get(key);
  if (hit && now - hit.at < TTL_MS) return hit.exists;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !apiKey) return true;
  try {
    const res = await fetcher(
      `${url}/rest/v1/articles?select=slug&market_code=eq.${locale}&slug=eq.${slug}&limit=1`,
      { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` } },
    );
    if (!res.ok) return true;
    const exists = ((await res.json()) as unknown[]).length > 0;
    cache.set(key, { exists, at: now });
    return exists;
  } catch {
    return true;
  }
}

/** For tests. */
export function clearArticleCache() {
  cache.clear();
}
