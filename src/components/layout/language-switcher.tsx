"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Slant } from "@/components/ui/slant";
import { Link } from "@/i18n/navigation";
import { matchLocalizedPathname } from "@/i18n/match-pathname";
import { routing, type Locale } from "@/i18n/routing";
import { sportFromSlug, sportSlug } from "@/lib/catalog/taxonomy";
import type { NavHref } from "./nav-types";

/**
 * The same page in another market. Sport slugs differ per market (tafeltennis /
 * tenis-de-mesa); unknown paths fall back to that market's home page.
 */
function hrefFor(path: string, from: Locale, to: Locale): NavHref {
  const match = matchLocalizedPathname(path, from);
  if (!match) return "/";
  const params = { ...match.params };
  const sport = params.sport ? sportFromSlug(params.sport, from) : null;
  if (sport) params.sport = sportSlug(sport, to);
  return (
    Object.keys(params).length ? { pathname: match.pathname, params } : match.pathname
  ) as NavHref;
}

/**
 * Market switcher (NL / ES). Built now, but only rendered once more than one market is
 * live (NEXT_PUBLIC_ACTIVE_LOCALES). Switching goes through the localized routes.
 */
export function LanguageSwitcher({
  variant,
  onNavigate,
}: {
  variant: "menu" | "compact" | "footer";
  onNavigate?: () => void;
}) {
  const t = useTranslations("header");
  const names = useTranslations("languages");
  const locale = useLocale() as Locale;
  // The public path ("/es/raquetas/padel"), matched against the route list below.
  const path = usePathname();

  if (routing.locales.length < 2) return null;

  if (variant === "footer") {
    return (
      <div role="group" aria-label={t("language")} className="flex items-center gap-1">
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          aria-hidden="true"
          className="mr-1"
        >
          <circle cx="8" cy="8" r="6.5" />
          <path d="M1.5 8h13M8 1.5c2 2 2.8 4.2 2.8 6.5S10 12.5 8 14.5M8 1.5C6 3.5 5.2 5.7 5.2 8S6 12.5 8 14.5" />
        </svg>
        {routing.locales.map((l) => {
          const current = l === locale;
          return (
            <Slant
              key={l}
              as={Link}
              size={5}
              href={hrefFor(path, locale, l)}
              locale={l}
              hrefLang={l}
              lang={l}
              aria-current={current ? "true" : undefined}
              aria-label={names(l)}
              className={`grid min-h-11 min-w-11 place-items-center px-2.5 text-[13px] font-semibold uppercase ${
                current
                  ? "bg-lime text-green-950 hover:text-green-950"
                  : "text-on-dark hover:text-white"
              }`}
            >
              {l}
            </Slant>
          );
        })}
      </div>
    );
  }

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
            href={hrefFor(path, locale, l)}
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
