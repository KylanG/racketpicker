import { routing, type Locale } from "@/i18n/routing";
import { parseProfile } from "./questions";

/**
 * True for /{locale}/keuzehulp/{sport}/{profile} with an unknown profile (e.g.
 * pro-snel). Unknown sports are already caught by hasUnknownSport. Rewritten to a real
 * 404 in the proxy, because notFound() after streaming returns status 200.
 */
export function hasUnknownAdvisorProfile(pathname: string): boolean {
  const parts = pathname.replace(/\/$/, "").split("/");
  if (parts.length !== 5) return false;
  const [, locale, segment, , profile] = parts;
  if (!(routing.locales as readonly string[]).includes(locale!)) return false;
  const route = routing.pathnames["/advisor/[sport]/[profile]"];
  const expected = (typeof route === "string" ? route : route[locale as Locale]).split("/")[1];
  return segment === expected && parseProfile(decodeURIComponent(profile!)) === null;
}
