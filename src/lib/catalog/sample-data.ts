/**
 * Sample products (is_sample = true, see supabase/seed.sql) are only shown when
 * NEXT_PUBLIC_SHOW_SAMPLE_DATA is "true". Set it in Vercel for Preview and Development,
 * never for Production. RLS cannot see the environment, so every catalog query must
 * apply this filter.
 */
export function showSampleData(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_SAMPLE_DATA === "true";
}

type FilterableQuery<Q> = { eq(column: "is_sample", value: boolean): Q };

/** Adds `is_sample = false` to a products query unless sample data is enabled. */
export function withoutSamples<Q extends FilterableQuery<Q>>(query: Q): Q {
  return showSampleData() ? query : query.eq("is_sample", false);
}
