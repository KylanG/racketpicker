import type { Locale } from "@/i18n/routing";
import { KIND_FROM_DB, type Kind } from "@/lib/catalog/racket-filters";
import type { SportKey } from "@/lib/catalog/taxonomy";

/** One published, real (non-sample) product as the sitemap needs it. */
export type SitemapProduct = {
  category: "rackets" | "accessories";
  sport: SportKey;
  tier: "A" | "B" | "C";
  brand: string;
  productType: string | null;
  /** Slug per market that has published content. */
  slugs: Partial<Record<Locale, string>>;
  updatedAt: string;
};

/** A route of the site, with params, before it becomes a URL per market. */
export type SitemapRoute =
  | { kind: "static"; pathname: StaticPath; priority: number }
  | { kind: "listing"; category: "rackets" | "accessories"; sport: SportKey; query?: string }
  | { kind: "product"; product: SitemapProduct }
  | { kind: "advisor"; sport: SportKey; profile: string };

export type StaticPath =
  | "/"
  | "/rackets"
  | "/deals"
  | "/advisor"
  | "/blog"
  | "/price-history"
  | "/how-we-earn"
  | "/about"
  | "/faq"
  | "/contact"
  | "/privacy"
  | "/cookies";

const STATIC: { pathname: StaticPath; priority: number }[] = [
  { pathname: "/", priority: 1 },
  { pathname: "/rackets", priority: 0.8 },
  { pathname: "/deals", priority: 0.8 },
  { pathname: "/advisor", priority: 0.8 },
  { pathname: "/blog", priority: 0.6 },
  { pathname: "/price-history", priority: 0.4 },
  { pathname: "/how-we-earn", priority: 0.4 },
  { pathname: "/about", priority: 0.3 },
  { pathname: "/faq", priority: 0.3 },
  { pathname: "/contact", priority: 0.2 },
  { pathname: "/privacy", priority: 0.1 },
  { pathname: "/cookies", priority: 0.1 },
];

/** A brand page (sport + one brand) is only worth indexing with at least this many products. */
export const MIN_BRAND_PRODUCTS = 2;

/**
 * Which routes go into the sitemap (RP-34): fixed pages, every sport overview with
 * products, sport + brand and sport + type pages, Tier A/B product pages and the advisor
 * outcomes for sports with rackets. Tier C products are noindex and stay out.
 */
export function sitemapRoutes(
  products: SitemapProduct[],
  advisorProfiles: readonly string[],
): SitemapRoute[] {
  const routes: SitemapRoute[] = STATIC.map((s) => ({ kind: "static", ...s }));
  const listings = new Map<string, { category: SitemapProduct["category"]; sport: SportKey }>();
  const brands = new Map<string, number>();
  const kinds = new Set<string>();

  for (const p of products) {
    listings.set(`${p.category}:${p.sport}`, { category: p.category, sport: p.sport });
    const brandKey = `${p.category}:${p.sport}:${p.brand}`;
    brands.set(brandKey, (brands.get(brandKey) ?? 0) + 1);
    const kind: Kind | undefined =
      p.category === "accessories" && p.productType ? KIND_FROM_DB[p.productType] : undefined;
    if (kind) kinds.add(`${p.sport}:${kind}`);
    if (p.tier !== "C") routes.push({ kind: "product", product: p });
  }

  for (const { category, sport } of listings.values()) {
    routes.push({ kind: "listing", category, sport });
  }
  for (const [key, count] of brands) {
    if (count < MIN_BRAND_PRODUCTS) continue;
    const [category, sport, brand] = key.split(":") as [
      SitemapProduct["category"],
      SportKey,
      string,
    ];
    routes.push({ kind: "listing", category, sport, query: `merk=${encodeURIComponent(brand)}` });
  }
  for (const key of kinds) {
    const [sport, kind] = key.split(":") as [SportKey, Kind];
    routes.push({ kind: "listing", category: "accessories", sport, query: `soort=${kind}` });
  }

  const racketSports = new Set(
    products.filter((p) => p.category === "rackets").map((p) => p.sport),
  );
  for (const sport of racketSports) {
    for (const profile of advisorProfiles) routes.push({ kind: "advisor", sport, profile });
  }
  return routes;
}
