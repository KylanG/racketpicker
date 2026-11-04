import type { Locale } from "@/i18n/routing";

/**
 * Sports and categories from the design handover. Keys match `sports.key` and
 * `categories.key` in Supabase; slugs are the public URL segments per market.
 * Labels live in messages/<locale>.json under `sports.*` and `categories.*`.
 */
export const SPORTS = [
  { key: "padel", slug: { nl: "padel", es: "padel" } },
  { key: "tennis", slug: { nl: "tennis", es: "tenis" } },
  { key: "badminton", slug: { nl: "badminton", es: "badminton" } },
  { key: "squash", slug: { nl: "squash", es: "squash" } },
  { key: "pickleball", slug: { nl: "pickleball", es: "pickleball" } },
  { key: "table-tennis", slug: { nl: "tafeltennis", es: "tenis-de-mesa" } },
] as const satisfies readonly { key: string; slug: Record<Locale, string> }[];

export const CATEGORIES = ["rackets", "shoes", "clothing", "accessories"] as const;

export type SportKey = (typeof SPORTS)[number]["key"];
export type CategoryKey = (typeof CATEGORIES)[number];

/** Public URL slug of a sport in a market, e.g. table-tennis → "tafeltennis" (nl). */
export function sportSlug(sport: SportKey, locale: Locale): string {
  return SPORTS.find((s) => s.key === sport)!.slug[locale];
}

/** Sport key for a URL slug in a market, or null for unknown slugs (→ 404). */
export function sportFromSlug(slug: string, locale: Locale): SportKey | null {
  return SPORTS.find((s) => s.slug[locale] === slug)?.key ?? null;
}

export function isCategory(value: string): value is CategoryKey {
  return (CATEGORIES as readonly string[]).includes(value);
}
