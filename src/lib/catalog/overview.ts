import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { CATALOG_TAG } from "./cache-tags";
import { catalogOverviewFromRows, type CatalogOverview } from "./overview-rows";
import { withoutSamples } from "./sample-data";

/**
 * Product counts per sport and category, and the brands with products, for the home page
 * ("Waar wil je beginnen?", merkenblok). Cached with the catalog tag.
 *
 * Reads one row per published product; PostgREST returns at most 1000 rows, which is
 * plenty for launch. Move this to a SQL view with counts once the catalog grows.
 */
export async function getCatalogOverview(): Promise<CatalogOverview> {
  "use cache";
  cacheTag(CATALOG_TAG);

  const { data, error } = await withoutSamples(
    createPublicClient()
      .from("products")
      .select("sport_key, category_key, is_sample, brands(slug, name, logo_path)")
      .eq("status", "published"),
  );
  if (error || !data) {
    console.error("[overview] could not load catalog overview", error?.message);
    cacheLife("minutes");
    return catalogOverviewFromRows([]);
  }
  cacheLife("days");
  return catalogOverviewFromRows(data);
}
