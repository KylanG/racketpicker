import { CATEGORIES, SPORTS, type CategoryKey, type SportKey } from "./taxonomy";

/** Sports with products per category, in taxonomy order. Categories without products are absent. */
export type CatalogAvailability = Partial<Record<CategoryKey, SportKey[]>>;

type NavRow = {
  category_key: string | null;
  sport_key: string | null;
  is_sample: boolean | null;
};

const SPORT_KEYS = SPORTS.map((s) => s.key) as readonly string[];

export function availabilityFromRows(rows: NavRow[], includeSamples: boolean): CatalogAvailability {
  const result: CatalogAvailability = {};
  for (const category of CATEGORIES) {
    const sports = new Set(
      rows
        .filter((r) => r.category_key === category && (includeSamples || !r.is_sample))
        .map((r) => r.sport_key)
        .filter((s): s is SportKey => s !== null && SPORT_KEYS.includes(s)),
    );
    if (sports.size > 0) result[category] = SPORTS.map((s) => s.key).filter((k) => sports.has(k));
  }
  return result;
}
