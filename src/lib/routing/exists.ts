/**
 * Small cached existence check against Supabase REST, for the proxy. The proxy answers
 * unknown slugs with a real 404, because with Cache Components a notFound() during
 * streaming would answer 200. Fails open (true) when Supabase cannot be reached, so the
 * page itself decides.
 */

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { exists: boolean; at: number }>();

export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** `query` is the REST path after /rest/v1/, e.g. "articles?select=slug&slug=eq.x&limit=1". */
export async function restRowExists(
  query: string,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
): Promise<boolean> {
  const hit = cache.get(query);
  if (hit && now - hit.at < TTL_MS) return hit.exists;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !apiKey) return true;
  try {
    const res = await fetcher(`${url}/rest/v1/${query}`, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return true;
    const exists = ((await res.json()) as unknown[]).length > 0;
    cache.set(query, { exists, at: now });
    return exists;
  } catch {
    return true;
  }
}

/** For tests. */
export function clearExistsCache() {
  cache.clear();
}
