import { ADVISOR_LIVE } from "@/lib/features";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BlogFilterProvider, BlogList, BlogTabs } from "@/components/blog/blog-filter";
import { Header } from "@/components/layout/header";
import { ArrowIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { Slant } from "@/components/ui/slant";
import { getAlternates } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import { intlLocale, type Locale } from "@/i18n/routing";
import { getArticles } from "@/lib/blog/articles";

export async function generateMetadata({ params }: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: getAlternates("/blog", locale),
  };
}

/** Blogs & tips (design/handoff/Blog.dc.html): hero with tabs, featured article, grid. */
export default async function BlogPage({ params }: PageProps<"/[locale]/blog">) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const [t, ts] = await Promise.all([
    getTranslations({ locale, namespace: "blog" }),
    getTranslations({ locale, namespace: "sports" }),
  ]);
  const articles = await getArticles(locale, (sport) => (sport ? ts(sport) : t("general")));
  const tags = [...new Set(articles.map((a) => a.tag))];
  const dateFormat = new Intl.DateTimeFormat(intlLocale[locale], { dateStyle: "long" });
  const labels = {
    featured: t("featured"),
    readArticle: t("readArticle"),
    emptyTag: t("emptyTag"),
    minutes: Object.fromEntries(
      articles.map((a) => [a.slug, t("minutes", { minutes: a.readingMinutes })]),
    ),
    dates: Object.fromEntries(
      articles.map((a) => [a.slug, dateFormat.format(new Date(`${a.publishedOn}T12:00:00`))]),
    ),
  };

  return (
    <BlogFilterProvider>
      <div className="rp-hero-sub text-white">
        <Header />
        <section className="rp-container flex flex-col gap-[18px] pt-[clamp(40px,5vw,72px)] pb-[clamp(48px,6vw,88px)]">
          <nav aria-label={t("breadcrumb")}>
            <ol className="text-on-dark flex gap-2 text-[13px]">
              <li className="flex gap-2">
                <Link href="/" className="text-on-dark hover:text-white">
                  {t("home")}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" className="text-white">
                {t("title")}
              </li>
            </ol>
          </nav>
          <Reveal>
            <h1 className="text-[clamp(32px,3.2vw,46px)] leading-[1.05] font-semibold tracking-[-0.4px]">
              {t("title")}
            </h1>
          </Reveal>
          <p className="text-on-dark-strong max-w-[640px] text-[17px] leading-normal">
            {t("intro")}
          </p>
          <BlogTabs tags={tags} label={t("filterLabel")} allLabel={t("all")} />
        </section>
      </div>

      <section className="rp-container flex w-full flex-col gap-10 pt-16 pb-[120px]">
        {articles.length > 0 ? (
          <BlogList articles={articles} labels={labels} />
        ) : (
          <div className="bg-surface flex flex-col items-start gap-5 p-10">
            <p className="text-muted max-w-[560px] text-[16px] leading-normal">
              {t(ADVISOR_LIVE ? "noArticles" : "noArticlesSoon")}
            </p>
            {ADVISOR_LIVE && (
              <Slant
                as={Link}
                href="/advisor"
                prefetch={false}
                className="flex items-center gap-2.5 bg-green-950 py-[13px] pr-[18px] pl-5 text-[14px] font-semibold text-white hover:text-white"
              >
                {t("noArticlesCta")}
                <ArrowIcon className="text-lime" />
              </Slant>
            )}
          </div>
        )}
      </section>
    </BlogFilterProvider>
  );
}
