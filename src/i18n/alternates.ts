import type { Metadata } from "next";
import { getPathname } from "./navigation";
import { defaultLocale, routing, type Locale } from "./routing";

type Href = Parameters<typeof getPathname>[0]["href"];

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Canonical + hreflang for one route across all live markets.
 * x-default points to the default market (/nl/...), not to the unprefixed root.
 */
export function getAlternates(href: Href, locale: Locale): Metadata["alternates"] {
  const url = (l: Locale) => siteUrl + getPathname({ href, locale: l });
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = url(l);
  languages["x-default"] = url(defaultLocale);

  return { canonical: url(locale), languages };
}
