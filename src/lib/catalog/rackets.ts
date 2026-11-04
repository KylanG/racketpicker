import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/feeds/images";
import { supabaseUrl } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { CATALOG_TAG } from "./cache-tags";
import { compareAtPrice, discountPercent, priceStatsFromRow } from "./pricing";
import { LEVEL_FROM_DB, STYLE_FROM_DB, type Level, type RacketItem } from "./racket-filters";
import { withoutSamples } from "./sample-data";
import { SPORTS, sportSlug, type SportKey } from "./taxonomy";

const SPORT_KEYS = SPORTS.map((s) => s.key) as readonly string[];

/**
 * All published rackets of a market with what the overview needs (price, Omnibus
 * discount, specs for the filters). One cached entry per market; filtering by sport and
 * by the URL filters happens per request on this list. Empty when Supabase is down.
 */
export async function getRacketListing(locale: Locale): Promise<RacketItem[]> {
  "use cache";
  cacheTag(CATALOG_TAG);

  const supabase = createPublicClient();
  const [products, stats, summaries, offers] = await Promise.all([
    withoutSamples(
      supabase
        .from("products")
        .select(
          "id, sport_key, is_sample, brands(slug, name), racket_specs(levels, play_style, weight_min_g, weight_max_g), product_content(slug, title, market_code, is_published), product_images(storage_path, position)",
        )
        .eq("status", "published")
        .eq("category_key", "rackets"),
    ),
    supabase.rpc("product_price_stats", { p_market_code: locale }),
    supabase
      .from("product_price_summary")
      .select("product_id, offer_count, in_stock_count")
      .eq("market_code", locale),
    supabase
      .from("offers")
      .select("product_id, price, source, checked_at")
      .eq("market_code", locale)
      .eq("is_active", true),
  ]);
  if (products.error || stats.error || summaries.error || offers.error || !products.data) {
    console.error(
      "[rackets] could not load listing",
      products.error?.message ?? stats.error?.message ?? summaries.error?.message,
    );
    cacheLife("minutes");
    return [];
  }
  cacheLife("days");

  const priceStats = new Map((stats.data ?? []).map((r) => [r.product_id, priceStatsFromRow(r)]));
  const summary = new Map(summaries.data.map((s) => [s.product_id, s]));
  // Lowest active offer per product, to label hand-checked prices with their date.
  const lowest = new Map<string, { price: number; source: string; checked_at: string | null }>();
  for (const o of offers.data ?? []) {
    const current = lowest.get(o.product_id);
    if (!current || o.price < current.price) lowest.set(o.product_id, o);
  }

  return products.data.flatMap((p): RacketItem[] => {
    const content = p.product_content.find((c) => c.market_code === locale && c.is_published);
    if (!content || !p.sport_key || !SPORT_KEYS.includes(p.sport_key) || !p.brands) return [];
    const sport = p.sport_key as SportKey;
    const s = priceStats.get(p.id);
    // One-to-one relation: an object (or null), not an array.
    const specs = p.racket_specs as {
      levels: string[];
      play_style: string | null;
      weight_min_g: number | null;
      weight_max_g: number | null;
    } | null;
    const image = [...p.product_images].sort((a, b) => a.position - b.position)[0];
    const weight =
      specs?.weight_min_g != null && specs.weight_max_g != null
        ? (specs.weight_min_g + specs.weight_max_g) / 2
        : null;

    return [
      {
        id: p.id,
        href: getPathname({
          locale,
          href: {
            pathname: "/rackets/[sport]/[product]",
            params: { sport: sportSlug(sport, locale), product: content.slug },
          },
        }),
        name: content.title,
        brand: { slug: p.brands.slug, name: p.brands.name },
        sport,
        imageUrl: image
          ? `${supabaseUrl()}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${image.storage_path}`
          : null,
        price: s?.currentPrice ?? null,
        compareAt: s ? compareAtPrice(s) : null,
        discount: s ? discountPercent(s) : null,
        shopCount: summary.get(p.id)?.offer_count ?? 0,
        inStock: (summary.get(p.id)?.in_stock_count ?? 0) > 0,
        checkedOn:
          lowest.get(p.id)?.source === "manual"
            ? (lowest.get(p.id)?.checked_at?.slice(0, 10) ?? null)
            : null,
        levels: (specs?.levels ?? [])
          .map((l) => LEVEL_FROM_DB[l])
          .filter((l): l is Level => Boolean(l)),
        style: specs?.play_style ? (STYLE_FROM_DB[specs.play_style] ?? null) : null,
        weight,
      },
    ];
  });
}
