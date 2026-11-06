import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { routing, type Locale } from "@/i18n/routing";
import { CATALOG_TAG } from "@/lib/catalog/cache-tags";
import { isSportKey } from "@/lib/catalog/taxonomy";
import { createPublicClient } from "@/lib/supabase/public";
import type { SitemapProduct } from "./sitemap-entries";

/**
 * Published, real products with their slug per live market, for the sitemap. Sample
 * products never go in, also not when sample data is shown. Empty when Supabase is down,
 * so the sitemap still lists the fixed pages.
 */
export async function getSitemapProducts(): Promise<SitemapProduct[]> {
  "use cache";
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("products")
    .select(
      "category_key, sport_key, tier, product_type, updated_at, brands(slug), product_content(slug, market_code, is_published)",
    )
    .eq("status", "published")
    .eq("is_sample", false)
    .in("category_key", ["rackets", "accessories"]);
  if (error || !data) {
    console.error("[sitemap] could not load products", error?.message);
    cacheLife("minutes");
    return [];
  }
  cacheLife("hours");

  const live = routing.locales as readonly string[];
  const products: SitemapProduct[] = [];
  for (const row of data) {
    if (!row.sport_key || !isSportKey(row.sport_key) || !row.brands) continue;
    const slugs: Partial<Record<Locale, string>> = {};
    for (const c of row.product_content) {
      if (c.is_published && live.includes(c.market_code)) slugs[c.market_code as Locale] = c.slug;
    }
    if (Object.keys(slugs).length === 0) continue;
    products.push({
      category: row.category_key as SitemapProduct["category"],
      sport: row.sport_key,
      tier: row.tier,
      brand: row.brands.slug,
      productType: row.product_type,
      slugs,
      updatedAt: row.updated_at,
    });
  }
  return products;
}
