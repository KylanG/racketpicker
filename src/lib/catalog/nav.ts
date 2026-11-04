import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { CATALOG_TAG } from "./cache-tags";
import { showSampleData } from "./sample-data";
import { availabilityFromRows, type CatalogAvailability } from "./nav-availability";

/**
 * Category × sport combinations that have published products, for the header menu.
 * Cached with the catalog tag, so the daily import refreshes the menu as well.
 * If Supabase cannot be reached the menu is empty for a few minutes rather than the page failing.
 */
export async function getCatalogAvailability(): Promise<CatalogAvailability> {
  "use cache";
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("catalog_nav")
    .select("category_key, sport_key, is_sample");
  if (error || !data) {
    console.error("[catalog-nav] could not load menu availability", error?.message);
    // Do not keep an empty menu around for days after a hiccup.
    cacheLife("minutes");
    return availabilityFromRows([], false);
  }
  cacheLife("days");
  return availabilityFromRows(data, showSampleData());
}
