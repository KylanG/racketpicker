import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { ADVISOR_LIVE } from "@/lib/features";
import { menuBrands } from "@/lib/catalog/menu-brands";
import { getCatalogAvailability } from "@/lib/catalog/nav";
import { getCatalogOverview } from "@/lib/catalog/overview";
import type { RacketItem } from "@/lib/catalog/racket-filters";
import { getCatalogListing } from "@/lib/catalog/rackets";
import { CATEGORIES, sportSlug, type CategoryKey } from "@/lib/catalog/taxonomy";
import { HeaderBar } from "./header-bar";
import {
  SPORT_ROUTE,
  type HeaderActive,
  type HeaderCta,
  type NavHref,
  type NavItem,
  type NavLink,
} from "./nav-types";

type HeaderProps = {
  /** Section the page belongs to: gets the lime underline. */
  active?: HeaderActive;
  /** "Bekijk deals" (season) or "Doe de keuzehulp". */
  cta?: HeaderCta;
};

/**
 * Shared header (design/handoff/Header.dc.html). Place it at the top of the page's
 * dark hero, so the transparent bar sits on the gradient, as in the prototype.
 * Menu items without products are left out (catalog_nav view).
 */
export async function Header({ active = null, cta = "deals" }: HeaderProps) {
  const locale = (await getLocale()) as Locale;
  const [availability, t, tc, ts, rackets, accessories, overview] = await Promise.all([
    getCatalogAvailability(),
    getTranslations("header"),
    getTranslations("categories"),
    getTranslations("sports"),
    getCatalogListing(locale, "rackets"),
    getCatalogListing(locale, "accessories"),
    getCatalogOverview(),
  ]);
  const listing: Partial<Record<CategoryKey, RacketItem[]>> = { rackets, accessories };

  const items: NavItem[] = CATEGORIES.flatMap((category) => {
    const sports = availability[category];
    if (!sports?.length) return [];
    const subs = sports.map((sport) => {
      const route = {
        pathname: SPORT_ROUTE[category],
        params: { sport: sportSlug(sport, locale) },
      };
      return {
        key: sport,
        name: t(`sub.${category}.${sport}.name`),
        description: t(`sub.${category}.${sport}.description`),
        href: route as NavHref,
        lower: `${ts(sport).toLowerCase()}${t(`categoryLower.${category}`)}`,
        brands: menuBrands((listing[category] ?? []).filter((i) => i.sport === sport)).map((b) => ({
          name: b.name,
          href: { ...route, query: { merk: b.slug } } as NavHref,
          items: b.items,
          count: b.count,
        })),
      };
    });
    const allHref: NavHref | null = category === "rackets" ? "/rackets" : null;
    return [
      {
        key: category,
        label: tc(category),
        lower: t(`categoryLower.${category}`),
        allHref,
        href: allHref ?? subs[0]!.href,
        subs,
      },
    ];
  });

  // "Merken" as soon as one brand has products (RP-55).
  const links: NavLink[] =
    overview.brands.length > 0 ? [{ key: "brands", label: t("brands"), href: "/brands" }] : [];

  return (
    <HeaderBar items={items} links={links} active={active} cta={ADVISOR_LIVE ? cta : "deals"} />
  );
}
