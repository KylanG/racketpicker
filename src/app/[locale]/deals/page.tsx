import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { FilterNavigationProvider } from "@/components/rackets/filter-context";
import { FilteredResults, ResultsSkeleton } from "@/components/rackets/rackets-overview";
import { Reveal } from "@/components/ui/reveal";
import { getAlternates } from "@/i18n/alternates";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  activeFilterCount,
  isListingVariant,
  parseFilters,
  type RacketItem,
} from "@/lib/catalog/racket-filters";
import { getCatalogListing } from "@/lib/catalog/rackets";

/**
 * Every product with a real discount (Omnibus: against the lowest price of the 30 days
 * before), rackets and accessories together, biggest discount first. Sold-out deals go
 * to the bottom (applyFilters). Filters are the overview's.
 */
async function getDeals(locale: Locale): Promise<RacketItem[]> {
  const [rackets, accessories] = await Promise.all([
    getCatalogListing(locale, "rackets"),
    getCatalogListing(locale, "accessories"),
  ]);
  return [...rackets, ...accessories]
    .filter((i) => i.discount != null)
    .sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[locale]/deals">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations({ locale, namespace: "deals" });
  const query = await searchParams;
  const filtered = activeFilterCount(parseFilters(query)) > 0 || isListingVariant(query);
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: getAlternates("/deals", locale),
    // A filtered list is a variation of this page: canonical to /deals, not indexed.
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function DealsPage({ params, searchParams }: PageProps<"/[locale]/deals">) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const [items, t, tr] = await Promise.all([
    getDeals(locale),
    getTranslations({ locale, namespace: "deals" }),
    getTranslations({ locale, namespace: "rackets" }),
  ]);
  return (
    <>
      <div className="rp-hero-sub text-white">
        <Header />
        <section className="rp-container flex flex-col gap-5 pt-[clamp(40px,5vw,72px)] pb-[clamp(48px,6vw,88px)]">
          <nav aria-label={tr("breadcrumb")}>
            <ol className="text-on-dark-3 flex flex-wrap gap-2 text-[13px]">
              <li className="flex gap-2">
                <Link href="/" className="text-on-dark-3 hover:text-white">
                  {tr("home")}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" className="text-white">
                {t("breadcrumb")}
              </li>
            </ol>
          </nav>
          <div className="flex max-w-[680px] flex-col gap-2.5">
            <Reveal>
              <h1 className="text-[clamp(32px,3.2vw,46px)] leading-[1.05] font-semibold tracking-[-0.4px]">
                {t("title")}
              </h1>
            </Reveal>
            <p className="text-on-dark-strong text-[16px] leading-normal">
              {items.length > 0 ? t("introCount", { count: items.length }) : t("intro")}
            </p>
          </div>
        </section>
      </div>

      <FilterNavigationProvider>
        <Suspense fallback={<ResultsSkeleton />}>
          <FilteredResults
            locale={locale}
            items={items}
            action={getPathname({ locale, href: "/deals" })}
            searchParams={searchParams}
            category="deals"
            defaultSort="korting"
          />
        </Suspense>
      </FilterNavigationProvider>
    </>
  );
}
