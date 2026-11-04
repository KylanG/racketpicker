"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ArrowIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { Slant } from "@/components/ui/slant";
import { Link } from "@/i18n/navigation";
import type { ArticleSummary } from "@/lib/blog/articles";
import { ArticleCard, ArticleImage } from "./article-card";

const ALL = "";

const FilterContext = createContext<{ tag: string; setTag: (tag: string) => void }>({
  tag: ALL,
  setTag: () => {},
});

/** Holds the selected tab; the tabs sit in the hero, the list below it. */
export function BlogFilterProvider({ children }: { children: ReactNode }) {
  const [tag, setTag] = useState(ALL);
  return <FilterContext.Provider value={{ tag, setTag }}>{children}</FilterContext.Provider>;
}

export function BlogTabs({
  tags,
  label,
  allLabel,
}: {
  tags: string[];
  label: string;
  allLabel: string;
}) {
  const { tag, setTag } = useContext(FilterContext);
  if (tags.length < 2) return null;
  return (
    <div role="group" aria-label={label} className="mt-2 flex flex-wrap gap-2">
      {[ALL, ...tags].map((t) => {
        const on = t === tag;
        return (
          <Slant
            as="button"
            key={t || "all"}
            type="button"
            aria-pressed={on}
            onClick={() => setTag(t)}
            className={`min-h-11 cursor-pointer px-[18px] text-[14px] font-medium transition-colors ${
              on ? "bg-lime text-green-950" : "bg-white/10 text-white hover:bg-white/16"
            }`}
          >
            {t || allLabel}
          </Slant>
        );
      })}
    </div>
  );
}

type Labels = {
  featured: string;
  readArticle: string;
  emptyTag: string;
  /** "{minutes} min" per article, keyed by slug. */
  minutes: Record<string, string>;
  /** Formatted publication date per article, keyed by slug. */
  dates: Record<string, string>;
};

export function BlogList({ articles, labels }: { articles: ArticleSummary[]; labels: Labels }) {
  const { tag } = useContext(FilterContext);
  const list = tag === ALL ? articles : articles.filter((a) => a.tag === tag);
  const [featured, ...rest] = list;

  if (!featured) {
    return <p className="bg-surface text-muted p-10 text-[16px]">{labels.emptyTag}</p>;
  }

  return (
    <>
      <Reveal>
        <Link
          href={{ pathname: "/blog/[slug]", params: { slug: featured.slug } }}
          className="group text-ink grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-center gap-[clamp(24px,4vw,56px)] hover:text-green-800"
        >
          <ArticleImage article={featured} sizes="(min-width: 1040px) 50vw, 100vw" priority />
          <div className="flex flex-col gap-3.5">
            <p className="text-[13px] font-semibold tracking-[1px] text-green-800 uppercase">
              {labels.featured} · {featured.tag} · {labels.minutes[featured.slug]}
            </p>
            <h2 className="text-[clamp(26px,2.6vw,36px)] leading-[1.15] font-semibold tracking-[-0.3px] text-balance">
              {featured.title}
            </h2>
            <p className="text-muted text-[17px] leading-[1.55]">{featured.intro}</p>
            <Slant
              as="span"
              className="mt-1.5 flex items-center gap-2.5 self-start bg-green-950 py-[13px] pr-[18px] pl-5 text-[14px] font-semibold text-white"
            >
              {labels.readArticle}
              <ArrowIcon className="text-lime" />
            </Slant>
          </div>
        </Link>
      </Reveal>
      {rest.length > 0 && (
        <Reveal
          stagger
          className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-x-6 gap-y-8"
        >
          {rest.map((a) => (
            <ArticleCard
              key={a.slug}
              article={a}
              minutesLabel={labels.minutes[a.slug]!}
              dateLabel={labels.dates[a.slug]}
            />
          ))}
        </Reveal>
      )}
    </>
  );
}
