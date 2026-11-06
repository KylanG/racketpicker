import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { BrandLogo, logoSrc } from "@/components/brands/brand-logo";
import { Header } from "@/components/layout/header";
import { FilterNavigationProvider } from "@/components/rackets/filter-context";
import { FilteredResults, ResultsSkeleton } from "@/components/rackets/rackets-overview";
import { Reveal } from "@/components/ui/reveal";
import { getAlternates } from "@/i18n/alternates";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getBrandPage } from "@/lib/catalog/brand-pages";
import { activeFilterCount, parseFilters } from "@/lib/catalog/racket-filters";
import { MIN_BRAND_PRODUCTS } from "@/lib/seo/sitemap-entries";
import { formatPrice } from "@/lib/format/price";

export function generateStaticParams() {
  // Cache Components needs one param at build time; real pages render on first visit.
  // "_" never matches a brand (the proxy answers unknown brands with a 404).
  return [{ brand: "_" }];
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[locale]/brands/[brand]">): Promise<Metadata> {
  const { locale, brand: slug } = (await params) as { locale: Locale; brand: string };
  const [t, page] = await Promise.all([
    getTranslations({ locale, namespace: "brands" }),
    getBrandPage(locale, slug),
  ]);
  if (!page) return {};
  // Filtered variants are the same page, and a brand with a single product is too thin.
  const noindex =
    activeFilterCount(parseFilters(await searchParams)) > 0 ||
    page.items.length < MIN_BRAND_PRODUCTS;
  return {
    title: t("brandMetaTitle", { brand: page.brand.name }),
    description: t("brandMetaDescription", { brand: page.brand.name, count: page.items.length }),
    alternates: getAlternates({ pathname: "/brands/[brand]", params: { brand: slug } }, locale),
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** One brand (RP-55): logo, a factual intro from the catalog and all its products. */
export default async function BrandPage({
  params,
  searchParams,
}: PageProps<"/[locale]/brands/[brand]">) {
  const { locale, brand: slug } = (await params) as { locale: Locale; brand: string };
  setRequestLocale(locale);
  const [page, t, tr] = await Promise.all([
    getBrandPage(locale, slug),
    getTranslations({ locale, namespace: "brands" }),
    getTranslations({ locale, namespace: "rackets" }),
  ]);
  // The proxy turns unknown brands into a 404 before rendering; this is a fallback.
  if (!page) return null;
  const { brand } = page;
  const parts = [
    page.rackets > 0 ? t("partRackets", { count: page.rackets }) : null,
    page.accessories > 0 ? t("partAccessories", { count: page.accessories }) : null,
  ]
    .filter(Boolean)
    .join(", ");
  const price =
    page.minPrice == null
      ? ""
      : page.maxPrice != null && page.maxPrice > page.minPrice
        ? t("priceRange", {
            min: formatPrice(page.minPrice, locale),
            max: formatPrice(page.maxPrice, locale),
          })
        : t("priceFrom", { min: formatPrice(page.minPrice, locale) });

  return (
    <>
      <div className="rp-hero-sub text-white">
        <Header active="brands" />
        <section className="rp-container flex flex-col gap-5 pt-[clamp(40px,5vw,72px)] pb-[clamp(48px,6vw,88px)]">
          <nav aria-label={tr("breadcrumb")}>
            <ol className="text-on-dark-3 flex flex-wrap gap-2 text-[13px]">
              <li className="flex gap-2">
                <Link href="/" className="text-on-dark-3 hover:text-white">
                  {tr("home")}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
              <li className="flex gap-2">
                <Link href="/brands" className="text-on-dark-3 hover:text-white">
                  {t("breadcrumb")}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" className="text-white">
                {brand.name}
              </li>
            </ol>
          </nav>
          <div className="flex max-w-[680px] flex-col gap-4">
            {brand.logoPath && (
              <span className="text-white">
                <BrandLogo
                  name={brand.name}
                  logo={logoSrc(brand.logoPath)}
                  className="h-14 w-[220px] [mask-position:left_center]"
                />
              </span>
            )}
            <Reveal>
              <h1 className="text-[clamp(32px,3.2vw,46px)] leading-[1.05] font-semibold tracking-[-0.4px]">
                {brand.name}
              </h1>
            </Reveal>
            <p className="text-on-dark-strong text-[16px] leading-normal">
              {t("brandIntro", { count: page.items.length, brand: brand.name, parts, price })}
            </p>
          </div>
        </section>
      </div>

      <FilterNavigationProvider>
        <Suspense fallback={<ResultsSkeleton />}>
          <FilteredResults
            locale={locale}
            items={page.items}
            action={getPathname({
              locale,
              href: { pathname: "/brands/[brand]", params: { brand: slug } },
            })}
            searchParams={searchParams}
            category="brand"
          />
        </Suspense>
      </FilterNavigationProvider>
    </>
  );
}
