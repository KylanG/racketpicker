import { defineRouting } from "next-intl/routing";

/** Every market the codebase supports. */
export const supportedLocales = ["nl", "es"] as const;
export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "nl";

/**
 * Markets that are live. A locale only gets routes, detection and hreflang once it is
 * listed here, so /es/ stays a 404 until launch. Override per environment with
 * NEXT_PUBLIC_ACTIVE_LOCALES="nl,es".
 */
export const activeLocales: Locale[] = (process.env.NEXT_PUBLIC_ACTIVE_LOCALES ?? defaultLocale)
  .split(",")
  .map((l) => l.trim())
  .filter((l): l is Locale => (supportedLocales as readonly string[]).includes(l));

export const routing = defineRouting({
  locales: activeLocales.length > 0 ? activeLocales : [defaultLocale],
  defaultLocale,
  localePrefix: "always",
  // Root "/" redirects on Accept-Language (es -> /es/ once live, everything else -> /nl/).
  localeDetection: true,
  // hreflang is set per page via getAlternates() so x-default can point to /nl/.
  alternateLinks: false,
  // Internal route names are English; public slugs are localized per market.
  pathnames: {
    "/": "/",
    "/padel-rackets": {
      nl: "/padelrackets",
      es: "/palas-de-padel",
    },
  },
});

/** BCP 47 tag per market, used for Intl formatting (prices, numbers, dates). */
export const intlLocale: Record<Locale, string> = {
  nl: "nl-NL",
  es: "es-ES",
};
