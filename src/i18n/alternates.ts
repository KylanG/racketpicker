import type { Metadata } from "next";
import { getPathname } from "./navigation";
import { defaultLocale, routing, type Locale } from "./routing";

type Href = Parameters<typeof getPathname>[0]["href"];

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Canonical + hreflang for one route across all live markets.
 * x-default points to the default market (/nl/...), not to the unprefixed root.
 * Pass a function when params are localized too (e.g. the sport slug per market).
 */
export function getAlternates(
  href: Href | ((locale: Locale) => Href),
  locale: Locale,
): Metadata["alternates"] {
  const hrefFor = typeof href === "function" ? href : () => href;
  const url = (l: Locale) => siteUrl + getPathname({ href: hrefFor(l), locale: l });
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = url(l);
  languages["x-default"] = url(defaultLocale);

  return { canonical: url(locale), languages };
}
