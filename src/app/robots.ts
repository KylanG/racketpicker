import type { MetadataRoute } from "next";
import { siteIndexable, siteOrigin } from "@/lib/seo/indexing";

/**
 * robots.txt (RP-34). Preview and local deployments are closed to crawlers. Production is
 * open, so search engines can read the noindex tag until launch; the sitemap is only
 * advertised once SITE_INDEXABLE is on. Outbound /go/ links and the API are never crawled.
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/go/", "/api/"] },
    ...(siteIndexable() ? { sitemap: `${siteOrigin()}/sitemap.xml` } : {}),
  };
}
