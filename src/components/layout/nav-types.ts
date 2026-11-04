import type { ComponentProps } from "react";
import type { Link } from "@/i18n/navigation";
import type { CategoryKey, SportKey } from "@/lib/catalog/taxonomy";

export type NavHref = ComponentProps<typeof Link>["href"];

export type NavSub = { key: SportKey; name: string; description: string; href: NavHref };

/** One top-level menu item; only categories with products get one. */
export type NavItem = {
  key: CategoryKey;
  label: string;
  /** Lowercase label for "Bekijk alle {x}". */
  lower: string;
  /** Category overview, if the category has one (only rackets for now). */
  allHref: NavHref | null;
  /** Where the desktop item links to until the mega menu (RP-45) opens a panel. */
  href: NavHref;
  subs: NavSub[];
};

export type HeaderActive = CategoryKey | "home" | null;
export type HeaderCta = "deals" | "advisor";
