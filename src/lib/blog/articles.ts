import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Locale } from "@/i18n/routing";
import { createPublicClient } from "@/lib/supabase/public";
import { BLOG_TAG } from "@/lib/catalog/cache-tags";
import { isSportKey, type SportKey } from "@/lib/catalog/taxonomy";

export type ArticleSummary = {
  slug: string;
  title: string;
  intro: string;
  /** Sport of the article; null = general. */
  sport: SportKey | null;
  /** Label for the tag, e.g. "Padel" or "Algemeen" (filled in by the caller's messages). */
  tag: string;
  readingMinutes: number;
  /** YYYY-MM-DD */
  publishedOn: string;
  image: { src: string; alt: string } | null;
};

export type Article = ArticleSummary & {
  body: string;
  author: string;
  updatedOn: string | null;
  metaDescription: string | null;
  relatedCategory: string | null;
};

type Row = {
  slug: string;
  title: string;
  intro: string;
  sport_key: string | null;
  reading_minutes: number;
  published_on: string | null;
  hero_image: string | null;
  hero_image_alt: string | null;
};

const SUMMARY_COLUMNS =
  "slug, title, intro, sport_key, reading_minutes, published_on, hero_image, hero_image_alt";

function toSummary(row: Row, tagFor: (sport: SportKey | null) => string): ArticleSummary {
  const sport = row.sport_key && isSportKey(row.sport_key) ? row.sport_key : null;
  return {
    slug: row.slug,
    title: row.title,
    intro: row.intro,
    sport,
    tag: tagFor(sport),
    readingMinutes: row.reading_minutes,
    publishedOn: row.published_on ?? "",
    image:
      row.hero_image && row.hero_image_alt
        ? { src: row.hero_image, alt: row.hero_image_alt }
        : null,
  };
}

/** All published articles of a market, newest first. RLS hides drafts and future dates. */
async function loadArticles(locale: Locale): Promise<Row[]> {
  "use cache";
  cacheTag(BLOG_TAG);

  const { data, error } = await createPublicClient()
    .from("articles")
    .select(SUMMARY_COLUMNS)
    .eq("market_code", locale)
    .eq("is_published", true)
    .order("published_on", { ascending: false })
    .order("title");
  if (error) {
    console.error("[blog] could not load articles", error.message);
    cacheLife("minutes");
    return [];
  }
  // A new article appears on its publication day without a deploy.
  cacheLife("hours");
  return data;
}

export async function getArticles(
  locale: Locale,
  tagFor: (sport: SportKey | null) => string,
): Promise<ArticleSummary[]> {
  return (await loadArticles(locale)).map((r) => toSummary(r, tagFor));
}

/** Latest articles for "Blogs & tips" on the homepage; the section hides when empty. */
export async function getLatestArticles(
  locale: Locale,
  tagFor: (sport: SportKey | null) => string,
  limit = 3,
): Promise<ArticleSummary[]> {
  return (await getArticles(locale, tagFor)).slice(0, limit);
}

async function loadArticle(locale: Locale, slug: string) {
  "use cache";
  cacheTag(BLOG_TAG);

  const { data, error } = await createPublicClient()
    .from("articles")
    .select(`${SUMMARY_COLUMNS}, body, author, updated_on, meta_description, related_category`)
    .eq("market_code", locale)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) {
    console.error("[blog] could not load article", slug, error.message);
    cacheLife("minutes");
    return null;
  }
  cacheLife("hours");
  return data;
}

export async function getArticle(
  locale: Locale,
  slug: string,
  tagFor: (sport: SportKey | null) => string,
): Promise<Article | null> {
  const row = await loadArticle(locale, slug);
  if (!row) return null;
  return {
    ...toSummary(row, tagFor),
    body: row.body,
    author: row.author,
    updatedOn: row.updated_on,
    metaDescription: row.meta_description,
    relatedCategory: row.related_category,
  };
}

/** Up to `limit` other articles: same sport first, then the newest. */
export function relatedArticles(
  all: ArticleSummary[],
  current: { slug: string; sport: SportKey | null },
  limit = 3,
): ArticleSummary[] {
  const others = all.filter((a) => a.slug !== current.slug);
  return [
    ...others.filter((a) => a.sport === current.sport),
    ...others.filter((a) => a.sport !== current.sport),
  ].slice(0, limit);
}
