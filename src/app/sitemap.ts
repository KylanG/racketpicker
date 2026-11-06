import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";
import { ADVISOR_LEVELS, ADVISOR_STYLES, profileSlug } from "@/lib/advisor/questions";
import { getArticles } from "@/lib/blog/articles";
import { sportSlug } from "@/lib/catalog/taxonomy";
import { siteOrigin } from "@/lib/seo/indexing";
import { getSitemapProducts } from "@/lib/seo/sitemap-data";
import { sitemapRoutes, type SitemapRoute } from "@/lib/seo/sitemap-entries";

type Href = Parameters<typeof getPathname>[0]["href"];

const PROFILES = ADVISOR_LEVELS.flatMap((niveau) =>
  ADVISOR_STYLES.map((stijl) => profileSlug({ niveau, stijl })),
);

/** The href of a route in one market, or null when that market has no version of it. */
function hrefFor(route: SitemapRoute, locale: Locale): { href: Href; query?: string } | null {
  switch (route.kind) {
    case "static":
      return { href: route.pathname };
    case "listing":
      return {
        href: {
          pathname: route.category === "rackets" ? "/rackets/[sport]" : "/accessories/[sport]",
          params: { sport: sportSlug(route.sport, locale) },
        },
        query: route.query,
      };
    case "product": {
      const slug = route.product.slugs[locale];
      if (!slug) return null;
      return {
        href: {
          pathname:
            route.product.category === "rackets"
              ? "/rackets/[sport]/[product]"
              : "/accessories/[sport]/[product]",
          params: { sport: sportSlug(route.product.sport, locale), product: slug },
        },
      };
    }
    case "brand":
      return { href: { pathname: "/brands/[brand]", params: { brand: route.brand } } };
    case "advisor":
      return {
        href: {
          pathname: "/advisor/[sport]/[profile]",
          params: { sport: sportSlug(route.sport, locale), profile: route.profile },
        },
      };
  }
}

function urlFor(route: SitemapRoute, locale: Locale): string | null {
  const target = hrefFor(route, locale);
  if (!target) return null;
  const path = getPathname({ href: target.href, locale });
  return `${siteOrigin()}${path}${target.query ? `?${target.query}` : ""}`;
}

/**
 * Sitemap with hreflang alternates (RP-34). Only indexable pages: see sitemapRoutes.
 * robots.txt only points here once the site is indexable (SITE_INDEXABLE).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getSitemapProducts();
  const routes = sitemapRoutes(products, PROFILES);
  const entries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    const languages: Record<string, string> = {};
    for (const l of routing.locales) {
      const url = urlFor(route, l);
      if (url) languages[l] = url;
    }
    if (languages[defaultLocale]) languages["x-default"] = languages[defaultLocale];
    for (const l of routing.locales) {
      const url = languages[l];
      if (!url) continue;
      entries.push({
        url,
        ...(route.kind === "product" ? { lastModified: route.product.updatedAt } : {}),
        ...(route.kind === "static" ? { priority: route.priority } : {}),
        alternates: { languages },
      });
    }
  }

  for (const locale of routing.locales) {
    for (const article of await getArticles(locale, () => "")) {
      entries.push({
        url:
          siteOrigin() +
          getPathname({
            href: { pathname: "/blog/[slug]", params: { slug: article.slug } },
            locale,
          }),
        lastModified: article.publishedOn,
      });
    }
  }
  return entries;
}
