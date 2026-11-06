import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOL_API, BOL_SPACING_MS, getBolToken, sleep } from "./bol";
import {
  DISCOVERY_TARGETS,
  planTitleCleanup,
  selectNewProducts,
  slugify,
  type BolSearchResult,
  type DiscoveryTarget,
  type NewProduct,
  type ProductType,
} from "./bol-discovery";

/** New products per run at most, so one odd search result page cannot flood the catalog. */
const MAX_NEW_PER_RUN = 60;
const PAGE_SIZE = 50;

type Fetcher = typeof fetch;

export type DiscoveryResult = {
  searched: Record<string, number>;
  created: number;
  /** Earlier products renamed by the current title cleanup (RP-85). */
  renamed: number;
  /** Clean names that already belong to another product: possible duplicates to review. */
  duplicates: string[];
  skipped: string[];
};

type Db = ReturnType<typeof createAdminClient>;

/**
 * Applies the current title cleanup to products the discovery created before (tier C,
 * no hand-written content), so improvements reach the whole catalog (RP-85).
 */
async function cleanUpTitles(db: Db, result: DiscoveryResult): Promise<void> {
  const [rows, all, slugs] = await Promise.all([
    db
      .from("products")
      .select(
        "id, brand_id, model, model_year, product_type, brands!inner(name), product_content!inner(slug, intro, market_code)",
      )
      .eq("tier", "C")
      .eq("is_sample", false)
      .eq("product_content.market_code", "nl"),
    db.from("products").select("brand_id, model, model_year"),
    db.from("product_content").select("slug").eq("market_code", "nl"),
  ]);
  if (rows.error || all.error || slugs.error) {
    throw new Error(rows.error?.message ?? all.error?.message ?? slugs.error?.message);
  }
  const candidates = rows.data
    .filter((r) => r.product_content.length === 1 && r.product_content[0]!.intro === null)
    .map((r) => ({
      id: r.id,
      brandId: r.brand_id,
      brand: r.brands.name,
      model: r.model,
      year: r.model_year,
      productType: (r.product_type as ProductType | null) ?? null,
      slug: r.product_content[0]!.slug,
    }));
  const { fixes, duplicates } = planTitleCleanup(candidates, {
    keys: new Set(
      all.data.map((p) => `${p.brand_id}|${p.model.toLowerCase()}|${p.model_year ?? ""}`),
    ),
    slugs: new Set(slugs.data.map((c) => c.slug)),
  });
  result.duplicates = duplicates.map((d) => d.title);
  for (const f of fixes) {
    try {
      const { error } = await db
        .from("products")
        .update({ model: f.model, model_year: f.year })
        .eq("id", f.id);
      if (error) throw new Error(error.message);
      const { error: contentError } = await db
        .from("product_content")
        .update({ title: f.title, ...(f.slug ? { slug: f.slug } : {}) })
        .eq("product_id", f.id)
        .eq("market_code", "nl");
      if (contentError) throw new Error(contentError.message);
      result.renamed++;
    } catch (e) {
      result.skipped.push(`rename ${f.title}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

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
 * Adds popular padel products from bol to the catalog (RP-77). New products are published
 * with content tier C (noindex until their content is filled in); accessories have their
 * own pages since RP-78. Prices and photos follow in the bol import that runs
 * right after. Never throws: a failure here must not stop the price import.
 */
export async function runBolDiscovery(fetcher: Fetcher = fetch): Promise<DiscoveryResult> {
  const result: DiscoveryResult = {
    searched: {},
    created: 0,
    renamed: 0,
    duplicates: [],
    skipped: [],
  };
  try {
    const db = createAdminClient();
    try {
      await cleanUpTitles(db, result);
    } catch (e) {
      result.skipped.push(`title cleanup: ${e instanceof Error ? e.message : String(e)}`);
    }
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
            status: "published",
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
