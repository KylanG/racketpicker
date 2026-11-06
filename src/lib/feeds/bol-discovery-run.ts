import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOL_API, BOL_SPACING_MS, getBolToken, sleep } from "./bol";
import {
  DISCOVERY_TARGETS,
  selectNewProducts,
  slugify,
  type BolSearchResult,
  type DiscoveryTarget,
  type NewProduct,
} from "./bol-discovery";

/** New products per run at most, so one odd search result page cannot flood the catalog. */
const MAX_NEW_PER_RUN = 60;
const PAGE_SIZE = 50;

type Fetcher = typeof fetch;

export type DiscoveryResult = {
  searched: Record<string, number>;
  created: number;
  skipped: string[];
};

/** Popular search results for one target, up to its limit. */
async function search(
  target: DiscoveryTarget,
  token: string,
  fetcher: Fetcher,
): Promise<BolSearchResult[]> {
  const results: BolSearchResult[] = [];
  for (let page = 1; results.length < target.limit; page++) {
    const url =
      `${BOL_API}/products/search?search-term=${encodeURIComponent(target.searchTerm)}` +
      `&country-code=NL&sort=POPULARITY&page=${page}&page-size=${PAGE_SIZE}` +
      `&include-offer=true&include-image=true`;
    const res = await fetcher(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Accept-Language": "nl",
      },
    });
    if (!res.ok) throw new Error(`bol search "${target.searchTerm}" failed: HTTP ${res.status}`);
    const data = (await res.json()) as { results?: BolSearchResult[]; totalPages?: number };
    results.push(...(data.results ?? []));
    await sleep(BOL_SPACING_MS);
    if (!data.results?.length || page >= (data.totalPages ?? page)) break;
  }
  return results.slice(0, target.limit);
}

/**
 * Adds popular padel products from bol to the catalog (RP-77). Rackets are published
 * with content tier C (noindex until their specs are filled in); accessories start as
 * drafts until their pages exist. Prices and photos follow in the bol import that runs
 * right after. Never throws: a failure here must not stop the price import.
 */
export async function runBolDiscovery(fetcher: Fetcher = fetch): Promise<DiscoveryResult> {
  const result: DiscoveryResult = { searched: {}, created: 0, skipped: [] };
  try {
    const db = createAdminClient();
    const [products, contents, brands] = await Promise.all([
      db
        .from("products")
        .select("gtins, model, model_year, brands!inner(name)")
        .eq("is_sample", false),
      db.from("product_content").select("slug").eq("market_code", "nl"),
      db.from("brands").select("id, slug, name"),
    ]);
    if (products.error || contents.error || brands.error) {
      throw new Error(products.error?.message ?? contents.error?.message ?? brands.error?.message);
    }
    const known = {
      eans: new Set(products.data.flatMap((p) => p.gtins)),
      keys: new Set(
        products.data.map((p) => `${p.brands.name}|${p.model.toLowerCase()}|${p.model_year ?? ""}`),
      ),
      slugs: new Set(contents.data.map((c) => c.slug)),
    };

    const token = await getBolToken(fetcher);
    const todo: NewProduct[] = [];
    for (const target of DISCOVERY_TARGETS) {
      try {
        const found = await search(target, token, fetcher);
        result.searched[target.key] = found.length;
        todo.push(...selectNewProducts(found, target, known));
      } catch (e) {
        result.skipped.push(`${target.key}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const brandId = new Map(brands.data.map((b) => [b.name.toLowerCase(), b.id]));
    for (const p of todo.slice(0, MAX_NEW_PER_RUN)) {
      try {
        let id = brandId.get(p.brand.toLowerCase());
        if (!id) {
          const { data, error } = await db
            .from("brands")
            .upsert({ slug: slugify(p.brand), name: p.brand }, { onConflict: "slug" })
            .select("id")
            .single();
          if (error) throw new Error(`brand: ${error.message}`);
          id = data.id;
          brandId.set(p.brand.toLowerCase(), id);
        }
        const { data: product, error } = await db
          .from("products")
          .insert({
            brand_id: id,
            category_key: p.category,
            sport_key: p.sport,
            model: p.model,
            model_year: p.year,
            gtins: [p.ean],
            tier: "C",
            status: p.category === "rackets" ? "published" : "draft",
            is_sample: false,
            product_type: p.productType,
          })
          .select("id")
          .single();
        if (error) throw new Error(`product: ${error.message}`);
        const { error: contentError } = await db.from("product_content").insert({
          product_id: product.id,
          market_code: "nl",
          slug: p.slug,
          title: p.title,
          is_published: true,
        });
        if (contentError) {
          await db.from("products").delete().eq("id", product.id);
          throw new Error(`content: ${contentError.message}`);
        }
        result.created++;
      } catch (e) {
        result.skipped.push(`${p.ean} ${p.title}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    if (todo.length > MAX_NEW_PER_RUN) {
      result.skipped.push(`${todo.length - MAX_NEW_PER_RUN} more left for the next run`);
    }
  } catch (e) {
    result.skipped.push(e instanceof Error ? e.message : String(e));
  }
  return result;
}
