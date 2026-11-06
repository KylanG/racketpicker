import { routing, type Locale } from "@/i18n/routing";

/** Result pages of the newsletter links (RP-32). */
export const NEWSLETTER_STATUSES = ["bevestigd", "afgemeld", "ongeldig"] as const;
export type NewsletterStatus = (typeof NEWSLETTER_STATUSES)[number];

export const isNewsletterStatus = (s: string): s is NewsletterStatus =>
  (NEWSLETTER_STATUSES as readonly string[]).includes(s);

/** True for /{locale}/nieuwsbrief/{x} with an unknown status: a real 404 in the proxy. */
export function hasUnknownNewsletterStatus(pathname: string): boolean {
  const parts = pathname.replace(/\/$/, "").split("/");
  if (parts.length !== 4) return false;
  const [, locale, segment, status] = parts;
  if (!(routing.locales as readonly string[]).includes(locale!)) return false;
  const route = routing.pathnames["/newsletter/[status]"];
  const expected = (typeof route === "string" ? route : route[locale as Locale]).split("/")[1];
  return segment === expected && !isNewsletterStatus(decodeURIComponent(status!));
}
