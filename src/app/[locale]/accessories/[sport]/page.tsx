import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { FilterNavigationProvider } from "@/components/rackets/filter-context";
import { FilteredResults, ResultsSkeleton } from "@/components/rackets/rackets-overview";
import { Reveal } from "@/components/ui/reveal";
import { Slant } from "@/components/ui/slant";
import { getPathname, Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { getShopCount } from "@/lib/catalog/deals";
import { listingBrand, listingSeo } from "@/lib/catalog/listing-metadata";
import { KINDS, parseFilters } from "@/lib/catalog/racket-filters";
import { getCatalogListing } from "@/lib/catalog/rackets";
import { SPORTS, sportFromSlug, sportSlug } from "@/lib/catalog/taxonomy";

type Params = { locale: Locale; sport: string };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    SPORTS.map(({ key }) => ({ locale, sport: sportSlug(key, locale) })),
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[locale]/accessories/[sport]">): Promise<Metadata> {
  const { locale, sport: slug } = (await params) as Params;
  const sport = sportFromSlug(slug, locale);
  if (!sport) return {};
  const query = await searchParams;
  const { soort } = parseFilters(query);
  const [t, brand] = await Promise.all([
    getTranslations({ locale, namespace: "accessories" }),
    listingBrand(locale, "accessories", query),
  ]);
  return {
    title: brand
      ? t("brandPageTitle", { brand })
      : soort.length === 1
        ? t(`kindTitle.${soort[0]!}`)
        : t("pageTitle"),
    description: t("metaDescription"),
    ...listingSeo(locale, sport, query, "accessories"),
  };
}

/**
 * Accessories per sport (design/handoff/Categorie.dc.html; RP-78), e.g.
 * /nl/accessoires/padel?soort=ballen. Type tabs in the hero; brand and price filters and
 * the card grid are the rackets overview's. Unknown sports 404 in the proxy.
 */
export default async function AccessoriesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/accessories/[sport]">) {
  const { locale, sport: slug } = (await params) as Params;
  setRequestLocale(locale);
  const sport = sportFromSlug(slug, locale);
  if (!sport) notFound();

  const [all, shopCount, t, tf, tr] = await Promise.all([
    getCatalogListing(locale, "accessories"),
    getShopCount(locale),
    getTranslations({ locale, namespace: "accessories" }),
    getTranslations({ locale, namespace: "rackets.filters" }),
    getTranslations({ locale, namespace: "rackets" }),
  ]);
  const items = all.filter((i) => i.sport === sport);
  const action = getPathname({
    locale,
    href: { pathname: "/accessories/[sport]", params: { sport: slug } },
  });

  return (
    <>
      <div className="rp-hero-sub text-white">
        <Header active="accessories" />
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
                {t("title")}
              </li>
            </ol>
          </nav>
          <div className="flex max-w-[640px] flex-col gap-2.5">
            <Reveal>
              <h1 className="text-[clamp(32px,3.2vw,46px)] leading-[1.05] font-semibold tracking-[-0.4px]">
                {t("pageTitle")}
              </h1>
            </Reveal>
            <p className="text-on-dark-strong text-[16px] leading-normal">
              {shopCount > 0 ? t("intro", { count: shopCount }) : t("introNoCount")}
            </p>
          </div>
          <Suspense fallback={null}>
            <KindTabs
              locale={locale}
              slug={slug}
              counts={Object.fromEntries(
                KINDS.map((k) => [k, items.filter((i) => i.kind === k).length]),
              )}
              total={items.length}
              searchParams={searchParams}
              labels={{
                group: t("kindTabs"),
                all: t("all"),
                ...Object.fromEntries(KINDS.map((k) => [k, tf(`kind.${k}`)])),
              }}
            />
          </Suspense>
        </section>
      </div>

      <FilterNavigationProvider>
        <Suspense fallback={<ResultsSkeleton />}>
          <FilteredResults
            locale={locale}
            items={items}
            action={action}
            searchParams={searchParams}
            category="accessories"
          />
        </Suspense>
      </FilterNavigationProvider>
    </>
  );
}

/** Type tabs (Alles, Tassen, Ballen, Grips): links that set ?soort=, as in the prototype. */
async function KindTabs({
  locale,
  slug,
  counts,
  total,
  searchParams,
  labels,
}: {
  locale: Locale;
  slug: string;
  counts: Record<string, number>;
  total: number;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  labels: Record<string, string>;
}) {
  const { soort } = parseFilters(await searchParams);
  const current = soort.length === 1 ? soort[0]! : null;
  const tabs = [null, ...KINDS.filter((k) => (counts[k] ?? 0) > 0)];
  if (tabs.length <= 2) return null;
  return (
    <nav aria-label={labels.group} className="mt-1.5">
      <ul className="flex flex-wrap gap-2">
        {tabs.map((kind) => (
          <li key={kind ?? "all"}>
            <Slant
              as={Link}
              size={8}
              locale={locale}
              href={{
                pathname: "/accessories/[sport]",
                params: { sport: slug },
                ...(kind ? { query: { soort: kind } } : {}),
              }}
              aria-current={kind === current ? "page" : undefined}
              className={`flex min-h-11 items-center gap-2 px-[18px] py-2.5 text-[14px] font-medium transition-colors ${
                kind === current
                  ? "bg-lime text-green-950 hover:text-green-950"
                  : "bg-white/10 text-white hover:bg-white/20 hover:text-white"
              }`}
            >
              {kind ? labels[kind] : labels.all}
              <span className="text-[13px] opacity-70">{kind ? counts[kind] : total}</span>
            </Slant>
          </li>
        ))}
      </ul>
    </nav>
  );
}
