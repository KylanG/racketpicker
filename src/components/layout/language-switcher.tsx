"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { sportFromSlug, sportSlug } from "@/lib/catalog/taxonomy";
import type { NavHref } from "./nav-types";

/** Same page in another market; sport slugs differ per market (tafeltennis / tenis-de-mesa). */
function hrefFor(
  pathname: string,
  params: Record<string, string | string[] | undefined>,
  from: Locale,
  to: Locale,
) {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (key === "locale" || typeof value !== "string") continue;
    const sport = key === "sport" ? sportFromSlug(decodeURIComponent(value), from) : null;
    next[key] = sport ? sportSlug(sport, to) : value;
  }
  return (Object.keys(next).length ? { pathname, params: next } : pathname) as NavHref;
}

/**
 * Market switcher (NL / ES). Built now, but only rendered once more than one market is
 * live (NEXT_PUBLIC_ACTIVE_LOCALES). Switching goes through the localized routes.
 */
export function LanguageSwitcher({
  variant,
  onNavigate,
}: {
  variant: "menu" | "compact";
  onNavigate?: () => void;
}) {
  const t = useTranslations("header");
  const names = useTranslations("languages");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const params = useParams();

  if (routing.locales.length < 2) return null;

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={variant === "menu" ? "flex gap-2" : "flex items-center gap-0.5"}
    >
      {routing.locales.map((l) => {
        const current = l === locale;
        return (
          <Link
            key={l}
            href={hrefFor(pathname, params, locale, l)}
            locale={l}
            hrefLang={l}
            lang={l}
            aria-current={current ? "true" : undefined}
            aria-label={names(l)}
            onClick={onNavigate}
            className={
              variant === "menu"
                ? `flex min-h-11 flex-1 items-center justify-center border border-white/30 text-[14px] font-medium uppercase ${
                    current ? "bg-lime text-green-950" : "text-white hover:bg-white/10"
                  }`
                : `grid min-h-11 min-w-9 place-items-center text-[13px] font-semibold uppercase ${
                    current ? "text-lime" : "hover:text-lime text-white"
                  }`
            }
          >
            {l}
          </Link>
        );
      })}
    </div>
  );
}
