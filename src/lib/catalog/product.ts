import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Locale } from "@/i18n/routing";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/feeds/images";
import { supabaseUrl } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { CATALOG_TAG, productTag } from "./cache-tags";
import { priceStatsFromRow, type PriceStats } from "./pricing";
import { summarizePrices } from "./product-price";
import {
  LEVEL_FROM_DB,
  STYLE_FROM_DB,
  weightClass,
  type Level,
  type Style,
  type Weight,
} from "./racket-filters";
import { showSampleData } from "./sample-data";
import { isSportKey, type SportKey } from "./taxonomy";

export type ProductOffer = {
  id: string;
  shop: { slug: string; name: string; freeShippingFrom: number | null };
  price: number;
  shippingCost: number | null;
  stock: "in_stock" | "low_stock" | "out_of_stock" | "preorder" | "unknown";
  deliveryDaysMin: number | null;
  deliveryDaysMax: number | null;
  /** YYYY-MM-DD for hand-checked prices (RP-68), else null. */
  checkedOn: string | null;
};

export type RacketSpecs = {
  shape: string | null;
  weightMin: number | null;
  weightMax: number | null;
  balance: string | null;
  balanceMm: number | null;
  core: string | null;
  face: string | null;
  frame: string | null;
  surface: string | null;
  thickness: number | null;
};

export type ProductPage = {
  id: string;
  slug: string;
  sport: SportKey;
  brand: { slug: string; name: string };
  /** Model without the brand, e.g. "AT10 Genius 18K Alum 2026". */
  model: string;
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  tier: "A" | "B" | "C";
  images: { src: string; alt: string }[];
  levels: Level[];
  style: Style | null;
  weight: Weight | null;
  specs: RacketSpecs | null;
  /** Active offers, cheapest first. */
  offers: ProductOffer[];
  stats: PriceStats | null;
};

const IN_STOCK = new Set(["in_stock", "low_stock", "preorder", "unknown"]);

export function isAvailable(offer: Pick<ProductOffer, "stock">): boolean {
  return IN_STOCK.has(offer.stock);
}

async function loadProduct(locale: Locale, slug: string) {
  "use cache";
  cacheTag(CATALOG_TAG);

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("product_content")
    .select(
      `slug, title, seo_title, seo_description,
       products!inner(id, model, model_year, tier, sport_key, is_sample, status,
         brands!inner(slug, name),
         racket_specs(shape, weight_min_g, weight_max_g, balance, balance_mm, core_material,
           face_material, frame_material, surface_texture, thickness_mm, levels, play_style),
         product_images(storage_path, alt, position))`,
    )
    .eq("market_code", locale)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) {
    console.error("[product] could not load", slug, error.message);
    cacheLife("minutes");
    return null;
  }
  if (!data) {
    cacheLife("hours");
    return null;
  }
  cacheTag(productTag(data.products.id));

  const [offers, stats] = await Promise.all([
    supabase
      .from("offers")
      .select(
        "id, price, shipping_cost, stock_status, delivery_days_min, delivery_days_max, source, checked_at, shops!inner(slug, name, free_shipping_from)",
      )
      .eq("product_id", data.products.id)
      .eq("market_code", locale)
      .eq("is_active", true)
      .order("price"),
    supabase.rpc("product_price_stats", { p_market_code: locale }),
  ]);
  if (offers.error || stats.error) {
    console.error("[product] could not load prices", offers.error?.message ?? stats.error?.message);
    cacheLife("minutes");
  } else {
    cacheLife("days");
  }
  return {
    content: data,
    offers: offers.data ?? [],
    stats: (stats.data ?? []).find((r) => r.product_id === data.products.id) ?? null,
  };
}

/** One racket for its product page, or null (unknown, unpublished or sample in production). */
export async function getProductPage(locale: Locale, slug: string): Promise<ProductPage | null> {
  const loaded = await loadProduct(locale, slug);
  if (!loaded) return null;
  const { content, offers, stats } = loaded;
  const p = content.products;
  if (p.status !== "published" || (p.is_sample && !showSampleData())) return null;
  if (!p.sport_key || !isSportKey(p.sport_key)) return null;

  const s = p.racket_specs as {
    shape: string | null;
    weight_min_g: number | null;
    weight_max_g: number | null;
    balance: string | null;
    balance_mm: number | null;
    core_material: string | null;
    face_material: string | null;
    frame_material: string | null;
    surface_texture: string | null;
    thickness_mm: number | null;
    levels: string[];
    play_style: string | null;
  } | null;
  const weightMid =
    s?.weight_min_g != null && s.weight_max_g != null
      ? (s.weight_min_g + s.weight_max_g) / 2
      : null;

  return {
    id: p.id,
    slug: content.slug,
    sport: p.sport_key,
    brand: { slug: p.brands.slug, name: p.brands.name },
    model: [p.model, p.model_year].filter(Boolean).join(" "),
    title: content.title,
    seoTitle: content.seo_title,
    seoDescription: content.seo_description,
    tier: p.tier,
    images: [...p.product_images]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({
        src: `${supabaseUrl()}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${i.storage_path}`,
        alt: i.alt ?? content.title,
      })),
    levels: (s?.levels ?? []).map((l) => LEVEL_FROM_DB[l]).filter((l): l is Level => Boolean(l)),
    style: s?.play_style ? (STYLE_FROM_DB[s.play_style] ?? null) : null,
    weight: weightClass(p.sport_key, weightMid),
    specs: s
      ? {
          shape: s.shape,
          weightMin: s.weight_min_g,
          weightMax: s.weight_max_g,
          balance: s.balance,
          balanceMm: s.balance_mm,
          core: s.core_material,
          face: s.face_material,
          frame: s.frame_material,
          surface: s.surface_texture,
          thickness: s.thickness_mm,
        }
      : null,
    offers: offers.map((o) => ({
      id: o.id,
      shop: {
        slug: o.shops.slug,
        name: o.shops.name,
        freeShippingFrom: o.shops.free_shipping_from,
      },
      price: Number(o.price),
      shippingCost: o.shipping_cost == null ? null : Number(o.shipping_cost),
      stock: o.stock_status,
      deliveryDaysMin: o.delivery_days_min,
      deliveryDaysMax: o.delivery_days_max,
      checkedOn: o.source === "manual" ? (o.checked_at?.slice(0, 10) ?? null) : null,
    })),
    stats: stats ? priceStatsFromRow(stats) : null,
  };
}

/**
 * Price summary for the product page. Cached: the Omnibus labels depend on today's date,
 * which Cache Components only allows inside a cache; the daily import revalidates it.
 */
export async function getProductPriceSummary(locale: Locale, slug: string) {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  const product = await getProductPage(locale, slug);
  return product ? summarizePrices(product.offers, product.stats) : null;
}
