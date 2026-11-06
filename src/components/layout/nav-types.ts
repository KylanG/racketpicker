import type { ComponentProps } from "react";
import type { Link } from "@/i18n/navigation";
import type { CategoryKey, SportKey } from "@/lib/catalog/taxonomy";

export type NavHref = ComponentProps<typeof Link>["href"];

/** Brand column in the mega menu (RP-45): a few models and a link to all of the brand. */
export type NavBrandColumn = {
  name: string;
  href: NavHref;
  items: { label: string; href: string }[];
  /** Products of this brand in the sub, for "Alle {count} van {brand}". */
  count: number;
};

export type NavSub = {
  key: SportKey;
  name: string;
  description: string;
  href: NavHref;
  /** Lowercase name for "Bekijk alle {x}", e.g. "padelrackets". */
  lower: string;
  /** Brands with the most products first. */
  brands: NavBrandColumn[];
};

/** One top-level menu item; only categories with products get one. */
export type NavItem = {
  key: CategoryKey;
  label: string;
  /** Lowercase label for "Bekijk alle {x}". */
  lower: string;
  /** Category overview, if the category has one (only rackets for now). */
  allHref: NavHref | null;
  /** First sub's overview; the desktop item opens the mega menu (RP-45) instead. */
  href: NavHref;
  subs: NavSub[];
};

export type HeaderActive = CategoryKey | "home" | "brands" | null;

/** Plain top-level link after the categories, e.g. "Merken" (RP-55). */
export type NavLink = { key: "brands"; label: string; href: NavHref };
export type HeaderCta = "deals" | "advisor";

/** Overview route per category; the sport is the dynamic segment. */
export const SPORT_ROUTE = {
  rackets: "/rackets/[sport]",
  shoes: "/shoes/[sport]",
  clothing: "/clothing/[sport]",
  accessories: "/accessories/[sport]",
} as const satisfies Record<CategoryKey, string>;
