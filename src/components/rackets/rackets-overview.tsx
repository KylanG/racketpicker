import type { ReactNode } from "react";
import { ADVISOR_LIVE } from "@/lib/features";
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
  filtersToQuery,
  EMPTY_FILTERS,
  facetCounts,
  FACETS,
  KINDS,
  LEVELS,
  PAGE_SIZE,
  parseFilters,
  parsePage,
  PRICES,
  sortItems,
  SORTS,
  STYLES,
  switchCount,
  toggleValue,
  weightClass,
  WEIGHTS,
  type Facet,
  type Kind,
  type RacketFilters,
  type RacketItem,
  type Sort,
} from "@/lib/catalog/racket-filters";
import { getRacketListing } from "@/lib/catalog/rackets";
import { SPORTS, sportSlug, type SportKey } from "@/lib/catalog/taxonomy";
import { formatPrice } from "@/lib/format/price";
import { FilterNavigationProvider, PendingResults } from "./filter-context";
import { FilterForm, type FilterGroup, type FilterPanelData } from "./filter-form";
import { FiltersDrawer } from "./filters-drawer";
import { FilterChip, LoadMore, QueryButton, ResultsGrid, ResultsToolbar } from "./results-controls";

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
              {shopCount > 0
                ? t(ADVISOR_LIVE ? "heroIntro" : "heroIntroFilter", { count: shopCount })
                : t(ADVISOR_LIVE ? "heroIntroNoCount" : "heroIntroNoCountFilter")}
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

export function ResultsSkeleton() {
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

/** Filter column and result grid; shared with the accessories overview (RP-78). */
export async function FilteredResults({
  locale,
  items,
  action,
  searchParams,
  category = "rackets",
  defaultSort = "populair",
  hideFacets = [],
}: {
  locale: Locale;
  items: RacketItem[];
  action: string;
  searchParams: SearchParams;
  category?: "rackets" | "accessories" | "deals" | "brand";
  /** Order without ?sorteer; the deals page starts with the biggest discount. */
  defaultSort?: Sort;
  /** Facets that make no sense here, e.g. "merk" on a brand page (RP-55). */
  hideFacets?: Facet[];
}) {
  const [params, t, tf, ts, tp, ta, td] = await Promise.all([
    searchParams,
    getTranslations("rackets"),
    getTranslations("rackets.filters"),
    getTranslations("sports"),
    getTranslations("productCard"),
    getTranslations("accessories"),
    // Deals (RP-86) and brand pages (RP-55) mix rackets and accessories: own texts.
    getTranslations(category === "brand" ? "brands" : "deals"),
  ]);
  const tl = await getTranslations("rackets.listing");
  const filters = parseFilters(params);
  const sort = filters.sort ?? defaultSort;
  // Sort first, then filter: applyFilters keeps the order and moves sold-out to the end.
  const results = applyFilters(sortItems(items, sort), filters);
  // "Meer laden" (RP-27): page n shows the first n × 24 results.
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(parsePage(params), pageCount);
  const shown = results.slice(0, page * PAGE_SIZE);
  const withPage = (n: number) => {
    const q = filtersToQuery(filters);
    return n > 1 ? `${q ? `${q}&` : "?"}pagina=${n}` : q;
  };
  // Sort choice keeps the filters, resets the page; the default order has no parameter.
  const sortQuery = Object.fromEntries(
    SORTS.map((s) => [s, filtersToQuery({ ...filters, sort: s === defaultSort ? undefined : s })]),
  );
  const bold = { b: (c: ReactNode) => <strong>{c}</strong> };
  // Texts per overview; the deals page (RP-86) mixes rackets and accessories.
  const copy =
    category === "rackets"
      ? {
          total: t.rich("results.total", { count: results.length, ...bold }),
          noneYetTitle: t("results.noneYetTitle"),
          noneYetText: t("results.noneYetText"),
          emptyTitle: t("results.emptyTitle"),
          emptyText: t(ADVISOR_LIVE ? "results.emptyText" : "results.emptyTextFilter"),
        }
      : category === "accessories"
        ? {
            total: ta.rich("total", { count: results.length, ...bold }),
            noneYetTitle: ta("noneYetTitle"),
            noneYetText: ta("noneYetText"),
            emptyTitle: ta("emptyTitle"),
            emptyText: ta("emptyText"),
          }
        : {
            total: td.rich("total", { count: results.length, ...bold }),
            noneYetTitle: td("noneYetTitle"),
            noneYetText: td("noneYetText"),
            emptyTitle: td("emptyTitle"),
            emptyText: td("emptyText"),
          };
  const panel = { ...panelData(items, filters, locale, tf, hideFacets), sort: filters.sort };
  // Active filters as removable labels, in panel order.
  const chips = [
    ...panel.groups.flatMap((g) =>
      g.options
        .filter((o) => o.checked)
        .map((o) => ({
          key: `${g.facet}-${o.value}`,
          label: o.label,
          query: filtersToQuery(toggleValue(filters, g.facet, o.value)),
        })),
    ),
    ...(filters.deals
      ? [
          {
            key: "deals",
            label: tf("onlyDeals"),
            query: filtersToQuery({ ...filters, deals: false }),
          },
        ]
      : []),
    ...(filters.hideSoldOut
      ? [
          {
            key: "soldout",
            label: tf("hideSoldOut"),
            query: filtersToQuery({ ...filters, hideSoldOut: false }),
          },
        ]
      : []),
  ];

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
          {ADVISOR_LIVE && category === "rackets" && (
            <Link
              href="/advisor"
              prefetch={false}
              className="mt-5 flex flex-col gap-1 bg-green-950 p-[18px] text-white hover:bg-green-900 hover:text-white"
            >
              <span className="text-lime text-[13px] font-semibold">{tf("advisorDoubt")}</span>
              <span className="text-[15px] font-semibold">{tf("advisorLink")}</span>
            </Link>
          )}
        </aside>
      )}

      <PendingResults label={tf("updating")}>
        <div className="flex flex-wrap items-center justify-between gap-3.5">
          <div className="flex flex-wrap items-center gap-3.5">
            {items.length > 0 && (
              <FiltersDrawer data={panel} action={action} total={results.length} />
            )}
            <h2 className="text-[15px] font-normal">{copy.total}</h2>
          </div>
          {results.length > 1 && (
            <ResultsToolbar
              sort={sort}
              options={SORTS.map((s) => ({ value: s, label: tl(`sort.${s}`) }))}
              queryFor={sortQuery}
              labels={{
                sort: tl("sortBy"),
                view: tl("view"),
                perRow: Object.fromEntries([2, 3, 4].map((n) => [n, tl("perRow", { count: n })])),
              }}
            />
          )}
        </div>

        {chips.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label={tl("activeFilters")}
          >
            {chips.map((c) => (
              <FilterChip
                key={c.key}
                label={c.label}
                query={c.query}
                removeLabel={tl("removeFilter", { label: c.label })}
              />
            ))}
            <QueryButton query={filtersToQuery({ ...EMPTY_FILTERS, sort: filters.sort })}>
              {tl("clearAll")}
            </QueryButton>
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-surface flex flex-col items-center gap-3.5 px-8 py-12 text-center">
            <p className="text-[20px] font-semibold">{copy.noneYetTitle}</p>
            <p className="text-muted text-[15px]">{copy.noneYetText}</p>
            {category === "deals" && (
              <Slant
                as={Link}
                size={8}
                href="/rackets"
                className="bg-ink px-5 py-3 text-[14px] font-semibold text-white hover:text-white"
              >
                {td("noneYetLink")}
              </Slant>
            )}
          </div>
        ) : results.length === 0 ? (
          <div className="bg-surface flex flex-col items-center gap-3.5 px-8 py-12 text-center">
            <p className="text-[20px] font-semibold">{copy.emptyTitle}</p>
            <p className="text-muted text-[15px]">{copy.emptyText}</p>
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
          <>
            <ResultsGrid>
              {shown.map((i, index) => (
                <li
                  key={i.id}
                  id={`r-${index + 1}`}
                  tabIndex={-1}
                  className="flex outline-offset-4 [&>*]:flex-1"
                >
                  <ProductCard
                    product={{
                      id: i.id,
                      href: i.href,
                      brand: i.brand.name,
                      sport: ts(i.sport),
                      name: i.name,
                      imageUrl: i.imageUrl,
                      tags: [
                        i.kind ? tf(`kindSingular.${i.kind}`) : null,
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
            </ResultsGrid>
            {pageCount > 1 && (
              <div className="mt-5 flex flex-col items-center gap-3">
                <span className="text-muted text-[14px]">
                  {tl("shown", { shown: shown.length, total: results.length })}
                </span>
                <div className="bg-line h-[3px] w-[200px]" aria-hidden="true">
                  <div
                    className="h-full bg-green-800"
                    style={{ width: `${Math.round((shown.length / results.length) * 100)}%` }}
                  />
                </div>
                {page < pageCount && (
                  <LoadMore query={withPage(page + 1)} focusId={`r-${shown.length + 1}`}>
                    {tl("loadMore")}
                  </LoadMore>
                )}
                <nav aria-label={tl("pagination")} className="mt-2">
                  <ul className="flex flex-wrap justify-center gap-1.5">
                    {Array.from({ length: pageCount }, (_, k) => {
                      const n = k + 1;
                      const current = n === page;
                      return (
                        <li key={n}>
                          <a
                            href={`${action}${withPage(n)}`}
                            aria-current={current ? "page" : undefined}
                            aria-label={tl("page", { page: n })}
                            className={`grid h-11 min-w-11 place-items-center text-[14px] font-semibold ${
                              current
                                ? "bg-ink text-white hover:text-white"
                                : "bg-surface text-ink hover:bg-surface-hover hover:text-ink"
                            }`}
                          >
                            {n}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            )}
          </>
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
  hideFacets: Facet[] = [],
): FilterPanelData {
  const price = (n: number) => formatPrice(n, locale);
  const label: Record<Exclude<Facet, "merk">, (v: string) => string> = {
    soort: (v) => t(`kind.${v as Kind}`),
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
    soort: KINDS,
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

  const groups: FilterGroup[] = FACETS.filter((facet) => !hideFacets.includes(facet))
    .map((facet) => {
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
    })
    .filter((g) => g.options.length > 0);

  return {
    groups,
    deals: { checked: f.deals, count: switchCount(items, f, "deals") },
    hideSoldOut: { checked: f.hideSoldOut, count: switchCount(items, f, "hideSoldOut") },
    activeCount: activeFilterCount(f),
  };
}
