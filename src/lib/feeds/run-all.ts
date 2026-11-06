import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { MANUAL_OFFERS } from "@/data/manual-offers";
import { runBolDiscovery, type DiscoveryResult } from "./bol-discovery-run";
import { syncBolSpecs, type SpecsSyncResult } from "./bol-specs-run";
import { syncProductImages, type ImageSyncResult } from "./images";
import { toRpcItems, validateManualOffers } from "./manual-offers";
import { runImport, type ImportResult } from "./run-import";

export type ShopOutcome =
  { shop: string; ok: true; result: ImportResult } | { shop: string; ok: false; error: string };

export type DailyImportResult = {
  startedAt: string;
  finishedAt: string;
  shops: ShopOutcome[];
  images: ImageSyncResult | { error: string };
  /** Hand-checked prices (RP-68): counts from upsert_manual_offers, or the error. */
  manual: Record<string, number> | { error: string };
  /** New products from bol (RP-77), before the bol price import; null without bol. */
  discovery: DiscoveryResult | null;
  /** Racket specifications from bol (RP-83); null without bol. */
  specs: SpecsSyncResult | null;
  /** Products moved from tier C to B (RP-82), or the error. */
  promoted: number | { error: string };
  /** True when at least one shop changed data and pages should be revalidated. */
  changed: boolean;
};

/**
 * Imports every active feed source, one shop at a time, then copies missing product
 * photos. A failing shop is logged in import_runs and does not stop the others.
 */
export async function runDailyImport(): Promise<DailyImportResult> {
  const startedAt = new Date().toISOString();
  const { data: sources, error } = await createAdminClient()
    .from("feed_sources")
    .select("shops!inner(slug)")
    .eq("is_active", true);
  if (error) throw new Error(`Loading feed sources failed: ${error.message}`);

  // New bol products first, so the bol import right after gives them prices and photos.
  const discovery = sources.some((s) => s.shops.slug === "bol") ? await runBolDiscovery() : null;

  const shops: ShopOutcome[] = [];
  for (const { shops: shop } of sources) {
    try {
      shops.push({ shop: shop.slug, ok: true, result: await runImport(shop.slug) });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`[feeds] ${shop.slug}: ${message}`);
      shops.push({ shop: shop.slug, ok: false, error: message });
    }
  }

  const manual = await importManualOffers();

  let images: DailyImportResult["images"];
  try {
    images = await syncProductImages(60);
  } catch (e) {
    images = { error: e instanceof Error ? e.message : String(e) };
    console.error(`[feeds] images: ${images.error}`);
  }

  const specs = sources.some((s) => s.shops.slug === "bol") ? await syncBolSpecs() : null;

  // After prices and photos, so a product with a new second shop is indexable the same night.
  const promoted = await promoteTiers();

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    shops,
    images,
    manual,
    discovery,
    specs,
    promoted,
    changed:
      shops.some((s) => s.ok) ||
      (discovery?.created ?? 0) > 0 ||
      (discovery?.renamed ?? 0) > 0 ||
      (specs?.filled ?? 0) > 0 ||
      (typeof promoted === "number" && promoted > 0) ||
      ("stored" in images && images.stored > 0) ||
      !("error" in manual),
  };
}

/**
 * Sends the hand-checked prices (src/data/manual-offers.ts) to Supabase. Runs every day,
 * also when the list did not change, so prices older than 7 days are turned off.
 */
async function importManualOffers(): Promise<DailyImportResult["manual"]> {
  const errors = validateManualOffers(MANUAL_OFFERS);
  if (errors.length) {
    console.error(`[feeds] manual offers invalid: ${errors.join("; ")}`);
    return { error: errors.join("; ") };
  }
  const { data, error } = await createAdminClient().rpc("upsert_manual_offers", {
    p_market_code: "nl",
    p_items: toRpcItems(MANUAL_OFFERS),
  });
  if (error) {
    console.error(`[feeds] manual offers: ${error.message}`);
    return { error: error.message };
  }
  return data as Record<string, number>;
}

/**
 * Tier C → B for products that now have at least two shops (RP-82, SQL function
 * promote_tiers). Never throws: a failure here must not hide the import result.
 */
async function promoteTiers(): Promise<DailyImportResult["promoted"]> {
  const { data, error } = await createAdminClient().rpc("promote_tiers");
  if (error) {
    console.error(`[feeds] promote tiers: ${error.message}`);
    return { error: error.message };
  }
  return data;
}
