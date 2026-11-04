import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createPublicClient } from "@/lib/supabase/public";
import { supabaseUrl } from "@/lib/supabase/env";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/feeds/images";
import { CATALOG_TAG } from "./cache-tags";
import { compareAtPrice, discountPercent, isFeaturedDeal, priceStatsFromRow } from "./pricing";
import { withoutSamples } from "./sample-data";
import { isCategory, sportSlug, type CategoryKey, type SportKey } from "./taxonomy";

/** A featured deal, before localizing labels (sport) in the component. */
export type Deal = {
  id: string;
  href: string;
  brand: string;
  name: string;
  sport: SportKey;
  category: CategoryKey;
  imageUrl: string | null;
  price: number;
  compareAt: number;
  discount: number;
  shopCount: number;
  inStock: boolean;
};

const imageUrl = (path: string) =>
  `${supabaseUrl()}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${path}`;

/**
 * Featured deals for the home page, biggest discount first. Cached with the catalog tag,
 * so the daily import refreshes them. Empty when Supabase cannot be reached.
 */
export async function getFeaturedDeals(locale: Locale, limit = 8): Promise<Deal[]> {
  "use cache";
  cacheTag(CATALOG_TAG);

  const supabase = createPublicClient();
  const { data: statsRows, error: statsError } = await supabase.rpc("product_price_stats", {
    p_market_code: locale,
  });
  if (statsError || !statsRows) {
    console.error("[deals] could not load price stats", statsError?.message);
    cacheLife("minutes");
    return [];
  }
  cacheLife("days");

  const stats = new Map(statsRows.map((row) => [row.product_id, priceStatsFromRow(row)]));
  const ids = [...stats].filter(([, s]) => isFeaturedDeal(s)).map(([id]) => id);
  if (ids.length === 0) return [];

  const [products, summaries] = await Promise.all([
    withoutSamples(
      supabase
        .from("products")
        .select(
          "id, model, model_year, sport_key, category_key, is_sample, brands(name), product_content(slug, title, market_code, is_published), product_images(storage_path, position)",
        )
        .in("id", ids)
        .eq("status", "published"),
    ),
    supabase
      .from("product_price_summary")
      .select("product_id, offer_count, in_stock_count")
      .in("product_id", ids)
      .eq("market_code", locale),
  ]);
  if (products.error || summaries.error) {
    console.error(
      "[deals] could not load products",
      products.error?.message ?? summaries.error?.message,
    );
    cacheLife("minutes");
    return [];
  }

  const summary = new Map(summaries.data.map((s) => [s.product_id, s]));
  const deals: Deal[] = [];
  for (const p of products.data) {
    const s = stats.get(p.id);
    const content = p.product_content.find((c) => c.market_code === locale && c.is_published);
    const sport = p.sport_key as SportKey | null;
    if (!s || !content || !sport || !isCategory(p.category_key)) continue;
    const price = s.currentPrice;
    const compareAt = compareAtPrice(s);
    const discount = discountPercent(s);
    if (price == null || compareAt == null || discount == null) continue;

    const href =
      p.category_key === "rackets"
        ? getPathname({
            locale,
            href: {
              pathname: "/rackets/[sport]/[product]",
              params: { sport: sportSlug(sport, locale), product: content.slug },
            },
          })
        : getPathname({
            locale,
            href: { pathname: "/rackets/[sport]", params: { sport: sportSlug(sport, locale) } },
          });
    const image = [...p.product_images].sort((a, b) => a.position - b.position)[0];
    const brand = p.brands?.name ?? "";

    deals.push({
      id: p.id,
      href,
      brand,
      name: content.title,
      sport,
      category: p.category_key,
      imageUrl: image ? imageUrl(image.storage_path) : null,
      price,
      compareAt,
      discount,
      shopCount: summary.get(p.id)?.offer_count ?? 0,
      inStock: (summary.get(p.id)?.in_stock_count ?? 0) > 0,
    });
  }

  // Sold-out products are never featured between available ones (design rule).
  return deals
    .filter((d) => d.inStock)
    .sort((a, b) => b.discount - a.discount || a.price - b.price)
    .slice(0, limit);
}

/** Number of active shops in a market, for "bij {count} winkels". */
export async function getShopCount(locale: Locale): Promise<number> {
  "use cache";
  cacheTag(CATALOG_TAG);

  const { count, error } = await createPublicClient()
    .from("shops")
    .select("id", { count: "exact", head: true })
    .eq("market_code", locale);
  if (error) {
    console.error("[shops] could not count shops", error.message);
    cacheLife("minutes");
    return 0;
  }
  cacheLife("days");
  return count ?? 0;
}
