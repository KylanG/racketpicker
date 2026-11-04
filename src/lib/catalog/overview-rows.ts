import { CATEGORIES, SPORTS, type CategoryKey, type SportKey } from "./taxonomy";

export type OverviewBrand = {
  slug: string;
  name: string;
  logoPath: string | null;
  /** Sport with the most products of this brand, for the brand link. */
  sport: SportKey;
  productCount: number;
};

export type CatalogOverview = {
  /** Sports with products, in taxonomy order. */
  sports: { key: SportKey; count: number }[];
  /** Categories with products, with the sports they cover. */
  categories: { key: CategoryKey; count: number; sports: SportKey[] }[];
  /** Brands with products, most products first. */
  brands: OverviewBrand[];
};

type Row = {
  sport_key: string | null;
  category_key: string;
  brands: { slug: string; name: string; logo_path: string | null } | null;
};

const SPORT_KEYS = SPORTS.map((s) => s.key) as readonly string[];
const isSport = (s: string | null): s is SportKey => s !== null && SPORT_KEYS.includes(s);

export function catalogOverviewFromRows(rows: Row[]): CatalogOverview {
  const sportCount = new Map<SportKey, number>();
  const category = new Map<CategoryKey, { count: number; sports: Set<SportKey> }>();
  const brands = new Map<
    string,
    { brand: NonNullable<Row["brands"]>; bySport: Map<SportKey, number> }
  >();

  for (const row of rows) {
    if (!isSport(row.sport_key)) continue;
    const sport = row.sport_key;
    sportCount.set(sport, (sportCount.get(sport) ?? 0) + 1);

    if ((CATEGORIES as readonly string[]).includes(row.category_key)) {
      const key = row.category_key as CategoryKey;
      const entry = category.get(key) ?? { count: 0, sports: new Set() };
      entry.count += 1;
      entry.sports.add(sport);
      category.set(key, entry);
    }

    if (row.brands) {
      const entry = brands.get(row.brands.slug) ?? { brand: row.brands, bySport: new Map() };
      entry.bySport.set(sport, (entry.bySport.get(sport) ?? 0) + 1);
      brands.set(row.brands.slug, entry);
    }
  }

  return {
    sports: SPORTS.flatMap(({ key }) =>
      sportCount.has(key) ? [{ key, count: sportCount.get(key)! }] : [],
    ),
    categories: CATEGORIES.flatMap((key) => {
      const entry = category.get(key);
      if (!entry) return [];
      return [
        {
          key,
          count: entry.count,
          sports: SPORTS.map((s) => s.key).filter((s) => entry.sports.has(s)),
        },
      ];
    }),
    brands: [...brands.values()]
      .map(({ brand, bySport }) => {
        // Ties go to the sport that comes first in the taxonomy (padel before tennis).
        const [sport] = [...bySport].sort(
          (a, b) => b[1] - a[1] || SPORT_KEYS.indexOf(a[0]) - SPORT_KEYS.indexOf(b[0]),
        )[0]!;
        const productCount = [...bySport.values()].reduce((a, b) => a + b, 0);
        return {
          slug: brand.slug,
          name: brand.name,
          logoPath: brand.logo_path,
          sport,
          productCount,
        };
      })
      .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name, "nl")),
  };
}
