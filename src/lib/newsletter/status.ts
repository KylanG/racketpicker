import { routing, type Locale } from "@/i18n/routing";

/** Result pages of the links in our mails: newsletter (RP-32) and alerts (RP-33). */
export const LINK_STATUSES = ["bevestigd", "afgemeld", "ongeldig"] as const;
export type LinkStatus = (typeof LINK_STATUSES)[number];

export const isLinkStatus = (s: string): s is LinkStatus =>
  (LINK_STATUSES as readonly string[]).includes(s);

const ROUTES = ["/newsletter/[status]", "/alerts/[status]"] as const;

/** True for /{locale}/{nieuwsbrief|prijsalert}/{x} with an unknown status: a real 404 in the proxy. */
export function hasUnknownLinkStatus(pathname: string): boolean {
  const parts = pathname.replace(/\/$/, "").split("/");
  if (parts.length !== 4) return false;
  const [, locale, segment, status] = parts;
  if (!(routing.locales as readonly string[]).includes(locale!)) return false;
  const known = ROUTES.some((r) => {
    const route = routing.pathnames[r];
    return (typeof route === "string" ? route : route[locale as Locale]).split("/")[1] === segment;
  });
  return known && !isLinkStatus(decodeURIComponent(status!));
}
