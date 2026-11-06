import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOL_SPACING_MS, getBolToken, getSpecifications, sleep, validGtin } from "./bol";
import { fillEmpty, flattenSpecs, racketSpecsFromBol } from "./bol-specs";

/** Products per run: one request each, well within the cron's time budget. */
const MAX_PER_RUN = 60;
/** Ask bol again after this many days, for specs bol filled in later. */
const REFRESH_DAYS = 30;

export type SpecsSyncResult = {
  checked: number;
  /** Products for which bol had any specification. */
  withSpecs: number;
  /** Products that got at least one racket_specs column from bol. */
  filled: number;
  /** Spec names we could not use yet, most frequent first (for RP-83 step 2). */
  unmapped: { name: string; count: number }[];
  failed: string[];
};

/**
 * Racket specifications from bol (RP-83). For real, published rackets with an EAN that bol
 * has not been asked about recently: store bol's raw specs and fill empty racket_specs
 * columns. Hand-entered values are never overwritten. Never throws.
 */
export async function syncBolSpecs(fetcher: typeof fetch = fetch): Promise<SpecsSyncResult> {
  const result: SpecsSyncResult = { checked: 0, withSpecs: 0, filled: 0, unmapped: [], failed: [] };
  const unmapped = new Map<string, number>();
  try {
    const db = createAdminClient();
    const since = new Date(Date.now() - REFRESH_DAYS * 86_400_000).toISOString();
    const [products, recent] = await Promise.all([
      db
        .from("products")
        .select("id, gtins, racket_specs(*)")
        .eq("category_key", "rackets")
        .eq("status", "published")
        .eq("is_sample", false),
      db
        .from("product_source_specs")
        .select("product_id")
        .eq("source", "bol")
        .gte("fetched_at", since),
    ]);
    if (products.error || recent.error) {
      throw new Error(products.error?.message ?? recent.error?.message);
    }
    const done = new Set(recent.data.map((r) => r.product_id));
    const todo = products.data
      .filter((p) => !done.has(p.id))
      .map((p) => ({ ...p, ean: p.gtins.find(validGtin) }))
      .filter((p): p is typeof p & { ean: string } => Boolean(p.ean))
      .slice(0, MAX_PER_RUN);
    if (todo.length === 0) return result;

    const token = await getBolToken(fetcher);
    for (const p of todo) {
      try {
        const groups = (await getSpecifications(p.ean, token, fetcher)) ?? [];
        await sleep(BOL_SPACING_MS);
        const specs = flattenSpecs(groups);
        const { mapped, unmapped: names } = racketSpecsFromBol(specs);
        for (const n of names) unmapped.set(n, (unmapped.get(n) ?? 0) + 1);
        result.checked++;
        if (specs.length) result.withSpecs++;

        const fill = fillEmpty(p.racket_specs, mapped);
        if (Object.keys(fill).length) {
          const { error } = await db
            .from("racket_specs")
            .upsert({ product_id: p.id, ...fill }, { onConflict: "product_id" });
          if (error) throw new Error(`racket_specs: ${error.message}`);
          result.filled++;
        }
        const { error } = await db.from("product_source_specs").upsert(
          {
            product_id: p.id,
            source: "bol",
            specs,
            unmapped: names,
            fetched_at: new Date().toISOString(),
          },
          { onConflict: "product_id,source" },
        );
        if (error) throw new Error(`product_source_specs: ${error.message}`);
      } catch (e) {
        result.failed.push(`${p.ean}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    result.failed.push(e instanceof Error ? e.message : String(e));
  }
  result.unmapped = [...unmapped]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
  return result;
}
