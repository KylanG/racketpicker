import type { RacketItem } from "./racket-filters";

export type MenuBrand = {
  slug: string;
  name: string;
  count: number;
  items: { label: string; href: string }[];
};

/**
 * Brand columns for the mega menu (RP-45): brands with the most products first (then by
 * name), each with its best-covered models (most shops, in stock first). Pure for tests.
 */
export function menuBrands(items: RacketItem[], maxBrands = 6, maxItems = 4): MenuBrand[] {
  const byBrand = new Map<string, { name: string; items: RacketItem[] }>();
  for (const i of items) {
    const entry = byBrand.get(i.brand.slug) ?? { name: i.brand.name, items: [] };
    entry.items.push(i);
    byBrand.set(i.brand.slug, entry);
  }
  return [...byBrand.entries()]
    .sort((a, b) => b[1].items.length - a[1].items.length || a[1].name.localeCompare(b[1].name))
    .slice(0, maxBrands)
    .map(([slug, { name, items: list }]) => ({
      slug,
      name,
      count: list.length,
      items: [...list]
        .sort(
          (a, b) =>
            Number(b.inStock) - Number(a.inStock) ||
            b.shopCount - a.shopCount ||
            a.name.localeCompare(b.name),
        )
        .slice(0, maxItems)
        .map((i) => ({
          label: i.name.toLowerCase().startsWith(`${name.toLowerCase()} `)
            ? i.name.slice(name.length + 1)
            : i.name,
          href: i.href,
        })),
    }));
}
