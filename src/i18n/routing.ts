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
  // Structure from the design handover: /{category}/{sport}/{product} (decided 4 nov).
  // Sport segments are localized separately (src/lib/catalog/taxonomy.ts).
  pathnames: {
    "/": "/",
    "/rackets": { nl: "/rackets", es: "/raquetas" },
    "/rackets/[sport]": { nl: "/rackets/[sport]", es: "/raquetas/[sport]" },
    "/rackets/[sport]/[product]": {
      nl: "/rackets/[sport]/[product]",
      es: "/raquetas/[sport]/[product]",
    },
    "/shoes/[sport]": { nl: "/schoenen/[sport]", es: "/zapatillas/[sport]" },
    "/clothing/[sport]": { nl: "/kleding/[sport]", es: "/ropa/[sport]" },
    "/accessories/[sport]": { nl: "/accessoires/[sport]", es: "/accesorios/[sport]" },
    "/accessories/[sport]/[product]": {
      nl: "/accessoires/[sport]/[product]",
      es: "/accesorios/[sport]/[product]",
    },
    "/advisor": { nl: "/keuzehulp", es: "/asesor" },
    // Outcome pages of the advisor (RP-50): /keuzehulp/padel/beginner-controle.
    "/advisor/[sport]/[profile]": {
      nl: "/keuzehulp/[sport]/[profile]",
      es: "/asesor/[sport]/[profile]",
    },
    // All real discounts in one place (RP-86).
    "/deals": { nl: "/deals", es: "/ofertas" },
    // Brand overview and one page per brand (RP-55).
    "/brands": { nl: "/merken", es: "/marcas" },
    "/brands/[brand]": { nl: "/merken/[brand]", es: "/marcas/[brand]" },
    "/blog": "/blog",
    "/blog/[slug]": "/blog/[slug]",
    "/favorites": { nl: "/favorieten", es: "/favoritos" },
    // Result of a newsletter confirmation or unsubscribe link (RP-32).
    "/newsletter/[status]": { nl: "/nieuwsbrief/[status]", es: "/boletin/[status]" },
    // Result of a price/stock alert confirmation or unsubscribe link (RP-33).
    "/alerts/[status]": { nl: "/prijsalert/[status]", es: "/alerta/[status]" },
    // Info pages from the footer; content follows in RP-36 (legal, KvK) and later tickets.
    "/about": { nl: "/over-ons", es: "/sobre-nosotros" },
    "/how-we-earn": { nl: "/hoe-we-verdienen", es: "/como-ganamos" },
    "/contact": { nl: "/contact", es: "/contacto" },
    "/privacy": { nl: "/privacy", es: "/privacidad" },
    "/cookies": { nl: "/cookiebeleid", es: "/politica-de-cookies" },
    "/faq": { nl: "/veelgestelde-vragen", es: "/preguntas-frecuentes" },
    "/price-history": { nl: "/prijshistorie", es: "/historial-de-precios" },
  },
});

/** BCP 47 tag per market, used for Intl formatting (prices, numbers, dates). */
export const intlLocale: Record<Locale, string> = {
  nl: "nl-NL",
  es: "es-ES",
};
