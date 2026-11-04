import type { Locale } from "@/i18n/routing";

export type ArticleSummary = {
  slug: string;
  title: string;
  /** Category label, e.g. "Padel" or "Deals". */
  tag: string;
  readingMinutes: number;
  image: { src: string; alt: string } | null;
};

/**
 * Latest articles for "Blogs & tips". There are no published articles yet (the blog
 * and its licensed photos follow in their own ticket), so the home section stays hidden
 * until this returns articles. Never fill it with placeholder articles.
 */
export async function getLatestArticles(locale: Locale, limit = 3): Promise<ArticleSummary[]> {
  void locale;
  void limit;
  return [];
}
