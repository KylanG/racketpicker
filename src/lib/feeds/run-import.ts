import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { fetchBolItems } from "./bol";
import {
  looksTruncated,
  prepareFeed,
  toIngestRow,
  type PipelineStats,
  type PreparedItem,
} from "./pipeline";
import type { AffiliateNetwork, CatalogProduct } from "./types";

const FEED_URL_ENV: Partial<Record<AffiliateNetwork, string>> = {
  daisycon: "DAISYCON_FEED_URLS",
  awin: "AWIN_FEED_URLS",
};

/**
 * Feed URLs contain credentials, so they live in env vars, not in the database:
 * DAISYCON_FEED_URLS='{"padeldiscount":"https://..."}'
 */
export function resolveFeedUrl(network: AffiliateNetwork, feedKey: string): string {
  const envName = FEED_URL_ENV[network];
  const raw = envName ? process.env[envName] : undefined;
  if (!envName || !raw) throw new Error(`Missing ${envName ?? "feed URL env var"} for ${network}`);
  let map: Record<string, string>;
  try {
    map = JSON.parse(raw) as Record<string, string>;
  } catch {
    throw new Error(`${envName} must be a JSON object like {"shop-slug":"https://..."}`);
  }
  const url = map[feedKey];
  if (!url) throw new Error(`No URL for "${feedKey}" in ${envName}`);
  return url;
}

/**
 * Products to match feed rows against. Feeds are filtered on padel rackets, so only
 * rackets; bol is asked per EAN, so there also accessories (RP-77), drafts included so
 * their price history builds up before their pages exist.
 */
export async function loadCatalog(allCategories = false): Promise<CatalogProduct[]> {
  let query = createAdminClient()
    .from("products")
    .select("id, model, model_year, gtins, category_key, brands!inner(name)")
    .eq("is_sample", false)
    .neq("status", "archived");
  if (!allCategories) query = query.eq("category_key", "rackets");
  const { data, error } = await query;
  if (error) throw new Error(`Loading catalog failed: ${error.message}`);
  return data.map((p) => ({
    id: p.id,
    brand: p.brands.name,
    model: p.model,
    modelYear: p.model_year,
    gtins: p.gtins,
    category: p.category_key,
  }));
}

export type ImportOptions = {
  /** Read the feed from these bytes instead of downloading it. */
  bytes?: Uint8Array;
  /** Parse and match only; write nothing. */
  dryRun?: boolean;
  /** Skip the truncated-feed safety check. */
  force?: boolean;
};

export type ImportResult = {
  shop: string;
  dryRun: boolean;
  pipeline: PipelineStats;
  database?: Json;
};

/** Imports one shop's feed end to end. Records every non-dry run in import_runs. */
export async function runImport(
  shopSlug: string,
  options: ImportOptions = {},
): Promise<ImportResult> {
  const db = createAdminClient();

  const { data: source, error: sourceError } = await db
    .from("feed_sources")
    .select("shop_id, network, feed_key, filter, is_active, shops!inner(slug)")
    .eq("shops.slug", shopSlug)
    .maybeSingle();
  if (sourceError) throw new Error(`Loading feed source failed: ${sourceError.message}`);
  if (!source) throw new Error(`No feed source configured for shop "${shopSlug}"`);
  if (!source.is_active && !options.dryRun) {
    throw new Error(`Feed source for "${shopSlug}" is not active`);
  }

  const catalog = await loadCatalog(source.network === "bol");
  let prepared: { items: PreparedItem[]; stats: PipelineStats };
  if (source.network === "bol") {
    // bol: best offer per EAN of our own catalog via the Marketing Catalog API (RP-72).
    const { data: images, error: imagesError } = await createAdminClient()
      .from("product_images")
      .select("product_id");
    if (imagesError) throw new Error(`Loading product images failed: ${imagesError.message}`);
    prepared = await fetchBolItems(catalog, {
      withImage: new Set(images.map((i) => i.product_id)),
    });
  } else {
    const bytes =
      options.bytes ?? (await download(resolveFeedUrl(source.network, source.feed_key)));
    prepared = prepareFeed(bytes, source.network, source.filter, catalog);
  }
  const { items, stats } = prepared;

  if (options.dryRun) return { shop: shopSlug, dryRun: true, pipeline: stats };

  const { count: previousActive } = await db
    .from("feed_items")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", source.shop_id)
    .eq("is_active", true);
  if (!options.force && looksTruncated(previousActive ?? 0, items.length)) {
    throw new Error(
      `Feed for "${shopSlug}" has ${items.length} items, previously ${previousActive}. ` +
        "Refusing to deactivate offers; rerun with force if this is expected.",
    );
  }

  const { data: run, error: runError } = await db
    .from("import_runs")
    .insert({ shop_id: source.shop_id, stats: stats as unknown as Json })
    .select("id")
    .single();
  if (runError) throw new Error(`Starting import run failed: ${runError.message}`);

  const { data: result, error } = await db.rpc("ingest_feed_items", {
    p_shop_id: source.shop_id,
    p_items: items.map(toIngestRow) as unknown as Json,
  });

  await db
    .from("import_runs")
    .update({
      status: error ? "failed" : "succeeded",
      finished_at: new Date().toISOString(),
      stats: { pipeline: stats, database: result ?? null } as unknown as Json,
      error: error?.message ?? null,
    })
    .eq("id", run.id);

  if (error) throw new Error(`Ingest failed: ${error.message}`);
  return { shop: shopSlug, dryRun: false, pipeline: stats, database: result };
}

async function download(url: string): Promise<Uint8Array> {
  const response = await fetch(url, { headers: { "Accept-Encoding": "gzip" } });
  if (!response.ok) throw new Error(`Feed download failed: HTTP ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}
