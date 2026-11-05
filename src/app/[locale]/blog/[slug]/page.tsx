import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArticleCard, ArticleImage } from "@/components/blog/article-card";
import { MarkdownBody } from "@/components/blog/markdown-body";
import { Header } from "@/components/layout/header";
import { ArrowIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { Slant } from "@/components/ui/slant";
import { getPathname, Link } from "@/i18n/navigation";
import { intlLocale, type Locale } from "@/i18n/routing";
import { getArticle, getArticles, relatedArticles } from "@/lib/blog/articles";
import type { SportKey } from "@/lib/catalog/taxonomy";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

async function tagFor(locale: Locale) {
  const [t, ts] = await Promise.all([
    getTranslations({ locale, namespace: "blog" }),
    getTranslations({ locale, namespace: "sports" }),
  ]);
  return (sport: SportKey | null) => (sport ? ts(sport) : t("general"));
}

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const articles = await getArticles(params.locale as Locale, () => "");
  // Cache Components needs at least one param at build time. "_" can never be a real slug
  // (the database only allows [a-z0-9-]), so it prerenders as not found.
  return articles.length > 0 ? articles.map((a) => ({ slug: a.slug })) : [{ slug: "_" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blog/[slug]">): Promise<Metadata> {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  const article = await getArticle(locale, slug, await tagFor(locale));
  if (!article) {
    const t = await getTranslations({ locale, namespace: "blog" });
    return { title: t("notFoundTitle"), robots: { index: false } };
  }
  const url =
    siteUrl + getPathname({ href: { pathname: "/blog/[slug]", params: { slug } }, locale });
  return {
    title: article.title,
    description: article.metaDescription ?? article.intro,
    // Articles are written per market, so there is no hreflang to other languages.
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.metaDescription ?? article.intro,
      url,
      publishedTime: article.publishedOn,
      ...(article.updatedOn ? { modifiedTime: article.updatedOn } : {}),
      ...(article.image ? { images: [{ url: siteUrl + article.image.src }] } : {}),
    },
  };
}

/** Article (design/handoff/Artikel.dc.html). Unknown slugs: see notFound note below. */
export default async function ArticlePage({ params }: PageProps<"/[locale]/blog/[slug]">) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  setRequestLocale(locale);
  const tag = await tagFor(locale);
  const [article, all, t] = await Promise.all([
    getArticle(locale, slug, tag),
    getArticles(locale, tag),
    getTranslations({ locale, namespace: "blog" }),
  ]);
  if (!article) notFound();

  const dateFormat = new Intl.DateTimeFormat(intlLocale[locale], { dateStyle: "long" });
  const date = (iso: string) => dateFormat.format(new Date(`${iso}T12:00:00`));
  const related = relatedArticles(all, article);
  const url =
    siteUrl + getPathname({ href: { pathname: "/blog/[slug]", params: { slug } }, locale });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription ?? article.intro,
    inLanguage: intlLocale[locale],
    datePublished: article.publishedOn,
    dateModified: article.updatedOn ?? article.publishedOn,
    author: { "@type": "Organization", name: article.author },
    publisher: { "@type": "Organization", name: "Racketpicker", url: siteUrl },
    mainEntityOfPage: url,
    articleSection: article.tag,
    ...(article.image ? { image: siteUrl + article.image.src } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped, so article text cannot close the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="rp-hero-sub text-white">
        <Header />
        <section
          className={`mx-auto flex max-w-[960px] flex-col gap-[18px] px-(--rp-gutter) pt-[clamp(40px,5vw,72px)] ${
            article.image ? "pb-[clamp(120px,14vw,200px)]" : "pb-[clamp(48px,6vw,88px)]"
          }`}
        >
          <nav aria-label={t("breadcrumb")}>
            <ol className="text-on-dark flex flex-wrap gap-2 text-[13px]">
              <li className="flex gap-2">
                <Link href="/" className="text-on-dark hover:text-white">
                  {t("home")}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
              <li className="flex gap-2">
                <Link href="/blog" className="text-on-dark hover:text-white">
                  {t("title")}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" className="text-white">
                {article.tag}
              </li>
            </ol>
          </nav>
          <Slant
            as="span"
            size={5}
            className="bg-lime self-start px-3 py-[5px] text-[13px] font-semibold text-green-950"
          >
            {article.tag}
          </Slant>
          <Reveal>
            <h1 className="text-[clamp(32px,3.6vw,52px)] leading-[1.06] font-semibold tracking-[-0.5px] text-balance">
              {article.title}
            </h1>
          </Reveal>
          <p className="text-on-dark flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
            <span>{article.author}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.publishedOn}>{date(article.publishedOn)}</time>
            <span aria-hidden="true">·</span>
            <span>{t("readingTime", { minutes: article.readingMinutes })}</span>
            {article.updatedOn && article.updatedOn !== article.publishedOn && (
              <>
                <span aria-hidden="true">·</span>
                <span>{t("updated", { date: date(article.updatedOn) })}</span>
              </>
            )}
          </p>
        </section>
      </div>

      {article.image && (
        <div className="relative z-1 mx-auto -mt-[clamp(90px,12vw,160px)] w-full max-w-[960px] px-(--rp-gutter)">
          <Reveal>
            <ArticleImage
              article={article}
              sizes="(min-width: 960px) 960px, 100vw"
              priority
              className="aspect-video shadow-[0_30px_60px_rgba(0,30,10,.2)]"
            />
          </Reveal>
        </div>
      )}

      <article className="mx-auto flex w-full max-w-[760px] flex-col gap-8 px-(--rp-gutter) pt-14 pb-10">
        <Reveal>
          <p className="text-ink text-[clamp(19px,1.6vw,22px)] leading-[1.55] font-medium text-pretty">
            {article.intro}
          </p>
        </Reveal>
        <MarkdownBody source={article.body} />
        <Reveal>
          <Slant
            as={Link}
            href="/advisor"
            prefetch={false}
            size={12}
            className="bg-lime hover:bg-lime-soft mt-2 flex items-center gap-[18px] px-7 py-6 text-green-950 hover:text-green-950"
          >
            <span className="flex flex-1 flex-col gap-1">
              <span className="text-[13px] font-semibold tracking-[1px] uppercase">
                {t("advisorEyebrow")}
              </span>
              <span className="text-[20px] font-semibold">{t("advisorTitle")}</span>
            </span>
            <ArrowIcon size={16} />
          </Slant>
        </Reveal>
      </article>

      {related.length > 0 && (
        <section className="rp-container flex w-full flex-col gap-7 pt-[72px] pb-[120px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Reveal>
              <h2 className="text-[clamp(26px,2.4vw,34px)] font-semibold tracking-[-0.3px]">
                {t("readAlso")}
              </h2>
            </Reveal>
            <Link href="/blog" className="rp-underline text-[15px] font-semibold">
              {t("allArticles")}
            </Link>
          </div>
          <Reveal
            stagger
            className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-6"
          >
            {related.map((a) => (
              <ArticleCard
                key={a.slug}
                article={a}
                headingLevel="h3"
                minutesLabel={t("minutes", { minutes: a.readingMinutes })}
              />
            ))}
          </Reveal>
        </section>
      )}
    </>
  );
}
