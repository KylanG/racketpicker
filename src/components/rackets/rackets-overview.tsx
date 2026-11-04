import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { Header } from "@/components/layout/header";
import { Reveal } from "@/components/ui/reveal";
import { Slant } from "@/components/ui/slant";
import { getPathname, Link } from "@/i18n/navigation";
import { intlLocale, type Locale } from "@/i18n/routing";
import { getShopCount } from "@/lib/catalog/deals";
import {
  activeFilterCount,
  applyFilters,
  EMPTY_FILTERS,
  facetCounts,
  FACETS,
  LEVELS,
  parseFilters,
  PRICES,
  STYLES,
  switchCount,
  weightClass,
  WEIGHTS,
  type Facet,
  type RacketFilters,
  type RacketItem,
} from "@/lib/catalog/racket-filters";
import { getRacketListing } from "@/lib/catalog/rackets";
import { SPORTS, sportSlug, type SportKey } from "@/lib/catalog/taxonomy";
import { formatPrice } from "@/lib/format/price";
import { FilterNavigationProvider, PendingResults } from "./filter-context";
import { FilterForm, type FilterGroup, type FilterPanelData } from "./filter-form";
import { FiltersDrawer } from "./filters-drawer";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Facets open by default, as in the prototype; a facet with a selection is always open. */
const OPEN_BY_DEFAULT: Facet[] = ["prijs", "niveau"];

export function pagePath(locale: Locale, sport: SportKey | null): string {
  return sport
    ? getPathname({
        locale,
        href: { pathname: "/rackets/[sport]", params: { sport: sportSlug(sport, locale) } },
      })
    : getPathname({ locale, href: "/rackets" });
}

/**
 * Rackets overview (design/handoff/Rackets.dc.html) for one sport or all sports.
 * The hero is static; the filtered part reads the query and streams in (Suspense).
 */
export async function RacketsOverview({
  locale,
  sport,
  searchParams,
}: {
  locale: Locale;
  sport: SportKey | null;
  searchParams: SearchParams;
}) {
  const [all, shopCount, t, ts, tc] = await Promise.all([
    getRacketListing(locale),
    getShopCount(locale),
    getTranslations("rackets"),
    getTranslations("sports"),
    getTranslations("categories"),
  ]);
  const tabs = [
    { key: null, label: t("allSports"), count: all.length },
    ...SPORTS.flatMap(({ key }) => {
      const count = all.filter((i) => i.sport === key).length;
      return count > 0 ? [{ key, label: ts(key), count }] : [];
    }),
  ];
  const title = sport ? t("pageTitle", { name: t(`sportTitle.${sport}`) }) : t("allTitle");

  return (
    <>
      <div className="rp-hero-sub text-white">
        <Header active="rackets" />
        <section className="rp-container flex flex-col gap-[22px] pt-[clamp(40px,5vw,72px)] pb-[clamp(48px,6vw,88px)]">
          <nav aria-label={t("breadcrumb")}>
            <ol className="text-on-dark-3 flex flex-wrap gap-2 text-[13px]">
              <li className="flex gap-2">
                <Link href="/" className="text-on-dark-3 hover:text-white">
                  {t("home")}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
              {sport ? (
                <>
                  <li className="flex gap-2">
                    <Link href="/rackets" className="text-on-dark-3 hover:text-white">
                      {tc("rackets")}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </li>
                  <li aria-current="page" className="text-white">
                    {ts(sport)}
                  </li>
                </>
              ) : (
                <li aria-current="page" className="text-white">
                  {tc("rackets")}
                </li>
              )}
            </ol>
          </nav>
          <div className="flex max-w-[680px] flex-col gap-2.5">
            <Reveal>
              <h1 className="text-[clamp(32px,3.2vw,46px)] leading-[1.05] font-semibold tracking-[-0.4px]">
                {title}
              </h1>
            </Reveal>
            <p className="text-on-dark-strong text-[16px] leading-normal">
              {shopCount > 0 ? t("heroIntro", { count: shopCount }) : t("heroIntroNoCount")}
            </p>
          </div>
          {tabs.length > 1 ? (
            <nav aria-label={t("sportTabs")} className="mt-1.5">
              <ul className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                  const current = tab.key === sport;
                  return (
                    <li key={tab.key ?? "all"}>
                      <Slant
                        as={Link}
                        size={8}
                        href={
                          tab.key
                            ? {
                                pathname: "/rackets/[sport]",
                                params: { sport: sportSlug(tab.key, locale) },
                              }
                            : "/rackets"
                        }
                        aria-current={current ? "page" : undefined}
                        className={`flex min-h-11 items-center gap-2 px-[18px] py-2.5 text-[14px] font-medium transition-colors ${
                          current
                            ? "bg-lime text-green-950 hover:text-green-950"
                            : "bg-white/10 text-white hover:bg-white/20 hover:text-white"
                        }`}
                      >
                        {tab.label}
                        <span className="text-[13px] opacity-70">{tab.count}</span>
                      </Slant>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}
        </section>
      </div>

      <FilterNavigationProvider>
        <Suspense fallback={<ResultsSkeleton />}>
          <FilteredResults
            locale={locale}
            items={sport ? all.filter((i) => i.sport === sport) : all}
            action={pagePath(locale, sport)}
            searchParams={searchParams}
          />
        </Suspense>
      </FilterNavigationProvider>
    </>
  );
}

function ResultsSkeleton() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="rp-container grid w-full gap-10 pt-8 pb-[120px] min-[900px]:grid-cols-[260px_minmax(0,1fr)]"
    >
      <div className="bg-surface hidden h-[520px] min-[900px]:block" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-surface-2 aspect-[3/4]" />
        ))}
      </div>
    </main>
  );
}

async function FilteredResults({
  locale,
  items,
  action,
  searchParams,
}: {
  locale: Locale;
  items: RacketItem[];
  action: string;
  searchParams: SearchParams;
}) {
  const [params, t, tf, ts, tp] = await Promise.all([
    searchParams,
    getTranslations("rackets"),
    getTranslations("rackets.filters"),
    getTranslations("sports"),
    getTranslations("productCard"),
  ]);
  const filters = parseFilters(params);
  const results = applyFilters(items, filters);
  const panel = panelData(items, filters, locale, tf);

  const levelLabel = (i: RacketItem) => {
    const [first] = i.levels;
    const last = i.levels[i.levels.length - 1];
    if (!first || !last) return null;
    return first === last ? tf(`level.${first}`) : `${tf(`level.${first}`)}–${tf(`level.${last}`)}`;
  };
  const weightLabel = (i: RacketItem) => {
    const w = weightClass(i.sport, i.weight);
    // Own labels on cards, so "Gemiddeld" (weight) is not confused with the level.
    return w ? tf(`weightTag.${w}`) : null;
  };

  return (
    <main
      id="main"
      tabIndex={-1}
      className="rp-container grid w-full items-start gap-10 pt-8 pb-[120px] min-[900px]:grid-cols-[260px_minmax(0,1fr)]"
    >
      {items.length > 0 && (
        <aside className="ease-rp sticky top-[calc(var(--rp-hdr,0px)+16px)] hidden max-h-[calc(100vh-32px-var(--rp-hdr,0px))] flex-col overflow-auto pr-1 transition-[top] duration-500 min-[900px]:flex">
          <FilterForm data={panel} idPrefix="aside" action={action} />
          <Link
            href="/advisor"
            prefetch={false}
            className="mt-5 flex flex-col gap-1 bg-green-950 p-[18px] text-white hover:bg-green-900 hover:text-white"
          >
            <span className="text-lime text-[13px] font-semibold">{tf("advisorDoubt")}</span>
            <span className="text-[15px] font-semibold">{tf("advisorLink")}</span>
          </Link>
        </aside>
      )}

      <PendingResults label={tf("updating")}>
        <div className="flex flex-wrap items-center gap-3.5">
          {items.length > 0 && (
            <FiltersDrawer data={panel} action={action} total={results.length} />
          )}
          <h2 className="text-[15px] font-normal">
            {t.rich("results.total", { count: results.length, b: (c) => <strong>{c}</strong> })}
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="bg-surface flex flex-col items-center gap-3.5 px-8 py-12 text-center">
            <p className="text-[20px] font-semibold">{t("results.noneYetTitle")}</p>
            <p className="text-muted text-[15px]">{t("results.noneYetText")}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-surface flex flex-col items-center gap-3.5 px-8 py-12 text-center">
            <p className="text-[20px] font-semibold">{t("results.emptyTitle")}</p>
            <p className="text-muted text-[15px]">{t("results.emptyText")}</p>
            <Slant
              as="a"
              size={8}
              href={action}
              className="bg-ink px-5 py-3 text-[14px] font-semibold text-white hover:text-white"
            >
              {t("results.clearAll")}
            </Slant>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 min-[560px]:grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
            {results.map((i) => (
              <li key={i.id} className="flex [&>*]:flex-1">
                <ProductCard
                  product={{
                    id: i.id,
                    href: i.href,
                    brand: i.brand.name,
                    sport: ts(i.sport),
                    name: i.name,
                    imageUrl: i.imageUrl,
                    tags: [
                      levelLabel(i),
                      i.style ? tf(`style.${i.style}`) : null,
                      weightLabel(i),
                    ].filter((x): x is string => Boolean(x)),
                    price: i.price,
                    compareAt: i.compareAt,
                    shopCount: i.shopCount,
                    inStock: i.inStock,
                    priceNote: i.checkedOn
                      ? tp("priceChecked", {
                          date: new Intl.DateTimeFormat(intlLocale[locale], {
                            day: "numeric",
                            month: "long",
                          }).format(new Date(i.checkedOn)),
                        })
                      : null,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </PendingResults>
    </main>
  );
}

type Translate = Awaited<ReturnType<typeof getTranslations<"rackets.filters">>>;

function panelData(
  items: RacketItem[],
  f: RacketFilters,
  locale: Locale,
  t: Translate,
): FilterPanelData {
  const price = (n: number) => formatPrice(n, locale);
  const label: Record<Exclude<Facet, "merk">, (v: string) => string> = {
    prijs: (v) =>
      v === "tot-75"
        ? t("priceUnder", { max: price(75) })
        : v === "250-plus"
          ? t("priceOver", { min: price(250) })
          : t("priceRange", {
              min: price(Number(v.split("-")[0])),
              max: price(Number(v.split("-")[1])),
            }),
    niveau: (v) => t(`level.${v as (typeof LEVELS)[number]}`),
    stijl: (v) => t(`style.${v as (typeof STYLES)[number]}`),
    gewicht: (v) => t(`weight.${v as (typeof WEIGHTS)[number]}`),
  };
  const values: Record<Exclude<Facet, "merk">, readonly string[]> = {
    prijs: PRICES,
    niveau: LEVELS,
    stijl: STYLES,
    gewicht: WEIGHTS,
  };
  const brands = [...new Map(items.map((i) => [i.brand.slug, i.brand.name])).entries()].sort(
    (a, b) => a[1].localeCompare(b[1], locale),
  );

  // Classes no product has at all are hidden (e.g. no weight classes for table tennis).
  const everywhere = Object.fromEntries(
    FACETS.map((facet) => [facet, facetCounts(items, EMPTY_FILTERS, facet)]),
  ) as Record<Facet, Map<string, number>>;

  const groups: FilterGroup[] = FACETS.map((facet) => {
    const counts = facetCounts(items, f, facet);
    const selected = f[facet] as string[];
    const options =
      facet === "merk"
        ? brands.map(([slug, name]) => ({ value: slug, label: name }))
        : values[facet]
            .filter((v) => everywhere[facet].has(v) || selected.includes(v))
            .map((v) => ({ value: v, label: label[facet](v) }));
    return {
      facet,
      title: t(`facet.${facet}`),
      open: OPEN_BY_DEFAULT.includes(facet) || selected.length > 0,
      options: options.map((o) => ({
        ...o,
        count: counts.get(o.value) ?? 0,
        checked: selected.includes(o.value),
      })),
    };
  }).filter((g) => g.options.length > 0);

  return {
    groups,
    deals: { checked: f.deals, count: switchCount(items, f, "deals") },
    hideSoldOut: { checked: f.hideSoldOut, count: switchCount(items, f, "hideSoldOut") },
    activeCount: activeFilterCount(f),
  };
}
