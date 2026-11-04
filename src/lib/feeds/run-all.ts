import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncProductImages, type ImageSyncResult } from "./images";
import { runImport, type ImportResult } from "./run-import";

export type ShopOutcome =
  { shop: string; ok: true; result: ImportResult } | { shop: string; ok: false; error: string };

export type DailyImportResult = {
  startedAt: string;
  finishedAt: string;
  shops: ShopOutcome[];
  images: ImageSyncResult | { error: string };
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

  let images: DailyImportResult["images"];
  try {
    images = await syncProductImages();
  } catch (e) {
    images = { error: e instanceof Error ? e.message : String(e) };
    console.error(`[feeds] images: ${images.error}`);
  }

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    shops,
    images,
    changed: shops.some((s) => s.ok) || ("stored" in images && images.stored > 0),
  };
}
