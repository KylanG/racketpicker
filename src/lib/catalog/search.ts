import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createPublicClient } from "@/lib/supabase/public";
import { CATALOG_TAG } from "./cache-tags";
import { withoutSamples } from "./sample-data";
import type { SearchEntry } from "./search-match";
import { sportSlug, type SportKey } from "./taxonomy";

/**
 * Search index for suggestions: published products with a page in this market.
 * Small enough to send to the client for now; the search screen (RP-46) can move this
 * to a server endpoint once the catalog grows.
 */
export async function getSearchIndex(locale: Locale): Promise<SearchEntry[]> {
  "use cache";
  cacheTag(CATALOG_TAG);

  const { data, error } = await withoutSamples(
    createPublicClient()
      .from("products")
      .select(
        "id, sport_key, category_key, is_sample, brands(name), product_content(slug, title, market_code, is_published)",
      )
      .eq("status", "published")
      .eq("category_key", "rackets"),
  );
  if (error || !data) {
    console.error("[search] could not load index", error?.message);
    cacheLife("minutes");
    return [];
  }
  cacheLife("days");

  return data.flatMap((p) => {
    const content = p.product_content.find((c) => c.market_code === locale && c.is_published);
    const sport = p.sport_key as SportKey | null;
    if (!content || !sport) return [];
    return [
      {
        id: p.id,
        name: content.title,
        brand: p.brands?.name ?? "",
        href: getPathname({
          locale,
          href: {
            pathname: "/rackets/[sport]/[product]",
            params: { sport: sportSlug(sport, locale), product: content.slug },
          },
        }),
      },
    ];
  });
}
