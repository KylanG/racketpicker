import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getCatalogAvailability } from "@/lib/catalog/nav";
import { CATEGORIES, sportSlug, type CategoryKey } from "@/lib/catalog/taxonomy";
import { HeaderBar } from "./header-bar";
import type { HeaderActive, HeaderCta, NavHref, NavItem } from "./nav-types";

const SPORT_ROUTE = {
  rackets: "/rackets/[sport]",
  shoes: "/shoes/[sport]",
  clothing: "/clothing/[sport]",
  accessories: "/accessories/[sport]",
} as const satisfies Record<CategoryKey, string>;

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
  const [locale, availability, t, tc] = await Promise.all([
    getLocale() as Promise<Locale>,
    getCatalogAvailability(),
    getTranslations("header"),
    getTranslations("categories"),
  ]);

  const items: NavItem[] = CATEGORIES.flatMap((category) => {
    const sports = availability[category];
    if (!sports?.length) return [];
    const subs = sports.map((sport) => ({
      key: sport,
      name: t(`sub.${category}.${sport}.name`),
      description: t(`sub.${category}.${sport}.description`),
      href: {
        pathname: SPORT_ROUTE[category],
        params: { sport: sportSlug(sport, locale) },
      } as NavHref,
    }));
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

  return <HeaderBar items={items} active={active} cta={cta} />;
}
