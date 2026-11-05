/**
 * Helpers for /go/[shop]/[offer] (RP-52): every click to a shop goes through our own route,
 * so we can count clicks per product and shop without storing personal data.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Link for a "Bekijk bij winkel" button. Always use with rel="sponsored nofollow". */
export function goHref(shopSlug: string, offerId: string): string {
  return `/go/${shopSlug}/${offerId}`;
}

export function validGoParams(shop: string, offer: string): boolean {
  return SLUG.test(shop) && UUID.test(offer);
}

/** Crawlers, link previews and uptime checkers do not count as clicks. */
const BOT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|skype|curl|wget|python|httpclient|headless|lighthouse|pingdom|uptime|monitor/i;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT.test(userAgent);
}

/** Only http(s) destinations; anything else (javascript:, data:, …) is refused. */
export function safeTarget(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/** Path of the page on our own site the click came from (no query string), or null. */
export function sourcePath(referer: string | null, ownOrigin: string): string | null {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    if (url.origin !== ownOrigin) return null;
    return url.pathname.slice(0, 300) || null;
  } catch {
    return null;
  }
}
