import "server-only";
import type { Json } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOL_SPACING_MS, getBolToken, getSpecifications, sleep, validGtin } from "./bol";
import {
  fillEmpty,
  flattenSpecs,
  racketSpecsFromBol,
  type FlatSpec,
  type MappedSpecs,
} from "./bol-specs";

/** New products per run: one bol request each, well within the cron's time budget. */
const MAX_PER_RUN = 60;
/** Ask bol again after this many days, for specs bol filled in later. */
const REFRESH_DAYS = 30;

export type SpecsSyncResult = {
  checked: number;
  /** Products for which bol had any specification. */
  withSpecs: number;
  /** Products whose racket_specs changed (new from bol or re-mapped from stored specs). */
  filled: number;
  /** Spec names we could not use yet, most frequent first. */
  unmapped: { name: string; count: number }[];
  failed: string[];
};

type Db = ReturnType<typeof createAdminClient>;
type Existing = Parameters<typeof fillEmpty>[0];

/** Applies a mapping to one product; returns whether racket_specs changed. */
async function apply(
  db: Db,
  productId: string,
  existing: Existing,
  specs: FlatSpec[],
  applied: MappedSpecs,
  unmapped: Map<string, number>,
): Promise<boolean> {
  const { mapped, unmapped: names } = racketSpecsFromBol(specs);
  for (const n of names) unmapped.set(n, (unmapped.get(n) ?? 0) + 1);
  const fill = fillEmpty(existing, mapped, applied);
  if (Object.keys(fill).length) {
    const { error } = await db
      .from("racket_specs")
      .upsert({ product_id: productId, ...fill }, { onConflict: "product_id" });
    if (error) throw new Error(`racket_specs: ${error.message}`);
  }
  const { error } = await db
    .from("product_source_specs")
    .update({ applied: { ...applied, ...fill } as Json, unmapped: names })
    .eq("product_id", productId)
    .eq("source", "bol");
  if (error) throw new Error(`product_source_specs: ${error.message}`);
  return Object.keys(fill).length > 0;
}

/**
 * Racket specifications from bol (RP-83). First re-maps the specs already stored (no bol
 * requests), so an improved mapping reaches every product; then asks bol for rackets it
 * has not been asked about recently. Hand-entered values are never overwritten. Never throws.
 */
export async function syncBolSpecs(fetcher: typeof fetch = fetch): Promise<SpecsSyncResult> {
  const result: SpecsSyncResult = { checked: 0, withSpecs: 0, filled: 0, unmapped: [], failed: [] };
  const unmapped = new Map<string, number>();
  try {
    const db = createAdminClient();
    const since = Date.now() - REFRESH_DAYS * 86_400_000;
    const [products, stored] = await Promise.all([
      db
        .from("products")
        .select("id, gtins, racket_specs(*)")
        .eq("category_key", "rackets")
        .eq("status", "published")
        .eq("is_sample", false),
      db
        .from("product_source_specs")
        .select("product_id, specs, applied, fetched_at")
        .eq("source", "bol"),
    ]);
    if (products.error || stored.error) {
      throw new Error(products.error?.message ?? stored.error?.message);
    }
    const byId = new Map(products.data.map((p) => [p.id, p]));

    for (const row of stored.data) {
      const p = byId.get(row.product_id);
      if (!p) continue;
      try {
        const specs = row.specs as FlatSpec[];
        if (await apply(db, p.id, p.racket_specs, specs, row.applied as MappedSpecs, unmapped)) {
          result.filled++;
        }
      } catch (e) {
        result.failed.push(`${p.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const recent = new Set(
      stored.data.filter((r) => Date.parse(r.fetched_at) >= since).map((r) => r.product_id),
    );
    const todo = products.data
      .filter((p) => !recent.has(p.id))
      .map((p) => ({ ...p, ean: p.gtins.find(validGtin) }))
      .filter((p): p is typeof p & { ean: string } => Boolean(p.ean))
      .slice(0, MAX_PER_RUN);
    if (todo.length === 0) return finish(result, unmapped);

    const previous = new Map(stored.data.map((r) => [r.product_id, r.applied as MappedSpecs]));
    const token = await getBolToken(fetcher);
    for (const p of todo) {
      try {
        const groups = (await getSpecifications(p.ean, token, fetcher)) ?? [];
        await sleep(BOL_SPACING_MS);
        const specs = flattenSpecs(groups);
        result.checked++;
        if (specs.length) result.withSpecs++;
        const applied = previous.get(p.id) ?? {};
        const { error } = await db.from("product_source_specs").upsert(
          {
            product_id: p.id,
            source: "bol",
            specs: specs as unknown as Json,
            applied: applied as Json,
            fetched_at: new Date().toISOString(),
          },
          { onConflict: "product_id,source" },
        );
        if (error) throw new Error(`product_source_specs: ${error.message}`);
        if (await apply(db, p.id, p.racket_specs, specs, applied, unmapped)) result.filled++;
      } catch (e) {
        result.failed.push(`${p.ean}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    result.failed.push(e instanceof Error ? e.message : String(e));
  }
  return finish(result, unmapped);
}

function finish(result: SpecsSyncResult, unmapped: Map<string, number>): SpecsSyncResult {
  result.unmapped = [...unmapped]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
  return result;
}
