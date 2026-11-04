"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowIcon } from "@/components/ui/icons";
import { Slant } from "@/components/ui/slant";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { MobileMenu } from "./mobile-menu";
import type { HeaderActive, HeaderCta, NavHref, NavItem } from "./nav-types";

/** Scroll distance after which the header becomes fixed and compact. */
const FIXED_AFTER = 160;
/** Minimum scroll step that hides (down) or shows (up) the fixed header. */
const SCROLL_DELTA = 6;

export const CTA_HREF: Record<HeaderCta, NavHref> = {
  deals: { pathname: "/", hash: "deals" },
  advisor: "/advisor",
};

/** Opens the search screen (RP-46 listens for this event). */
export const OPEN_SEARCH_EVENT = "rp:open-search";

/**
 * Smart sticky header: after 160px it turns fixed, compact (12px) and dark; scrolling
 * down hides it (top −120px), scrolling up shows it again. `--rp-hdr` holds the visible
 * height for other sticky elements (product tabs, filter column).
 */
function useSmartSticky() {
  const rootRef = useRef<HTMLElement>(null);
  const [state, setState] = useState({ fixed: false, visible: true, entering: false });
  const [placeholder, setPlaceholder] = useState<number | null>(null);
  const current = useRef({ fixed: false, visible: true });

  useEffect(() => {
    let lastY = window.scrollY;
    const measure = () => {
      if (!current.current.fixed && rootRef.current) setPlaceholder(rootRef.current.offsetHeight);
    };
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      const fixed = y > FIXED_AFTER;
      let visible = current.current.visible;
      if (!fixed) visible = true;
      else if (delta > SCROLL_DELTA) visible = false;
      else if (delta < -SCROLL_DELTA) visible = true;
      if (Math.abs(delta) > SCROLL_DELTA || !fixed) lastY = y;
      const entering = fixed && !current.current.fixed;
      // Slides in from above the first time it turns fixed, instead of jumping.
      if (entering) visible = false;
      if (fixed !== current.current.fixed || visible !== current.current.visible) {
        if (!fixed) measure();
        current.current = { fixed, visible };
        setState({ fixed, visible, entering });
      }
    };
    measure();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      document.documentElement.style.removeProperty("--rp-hdr");
    };
  }, []);

  useEffect(() => {
    if (!state.entering) return;
    const id = requestAnimationFrame(() => setState((s) => ({ ...s, entering: false })));
    return () => cancelAnimationFrame(id);
  }, [state.entering]);

  useEffect(() => {
    const height = state.fixed && state.visible ? (rootRef.current?.offsetHeight ?? 0) : 0;
    document.documentElement.style.setProperty("--rp-hdr", `${height}px`);
  }, [state.fixed, state.visible]);

  /** Keyboard users tabbing into a hidden header get it back. */
  const reveal = () => {
    if (current.current.fixed && !current.current.visible) {
      current.current.visible = true;
      setState((s) => ({ ...s, visible: true }));
    }
  };

  return { rootRef, placeholder, reveal, ...state };
}

function FavoritesLink({ count }: { count: number }) {
  const t = useTranslations("header");
  return (
    <Link
      href="/favorites"
      // The favorites page follows in RP-53; no prefetch of a route that 404s until then.
      prefetch={false}
      aria-label={t("favorites", { count })}
      className="hover:text-lime relative grid size-11 shrink-0 place-items-center text-white"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"
          fill={count > 0 ? "var(--color-lime)" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
      {count > 0 && (
        <span
          className="bg-lime absolute top-1 right-0.5 grid h-[18px] min-w-[18px] place-items-center px-[5px] text-[12px] font-bold text-green-950"
          style={{ clipPath: "polygon(3px 0,100% 0,calc(100% - 3px) 100%,0 100%)" }}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

function SearchButton() {
  const t = useTranslations("header");
  return (
    <button
      type="button"
      aria-label={t("search")}
      aria-haspopup="dialog"
      onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
      className="hover:text-lime grid size-11 shrink-0 cursor-pointer place-items-center text-white"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="8.5" cy="8.5" r="6" />
        <path d="M13 13l5 5" />
      </svg>
    </button>
  );
}

export function HeaderBar({
  items,
  active,
  cta,
}: {
  items: NavItem[];
  active: HeaderActive;
  cta: HeaderCta;
}) {
  const t = useTranslations("header");
  const { rootRef, placeholder, reveal, fixed, visible, entering } = useSmartSticky();
  // Favorites store follows in RP-53.
  const favoriteCount = 0;

  return (
    <div style={{ height: placeholder ?? undefined }}>
      <div
        className={`inset-x-0 z-50 ${
          fixed ? "shadow-header fixed bg-green-950" : "relative bg-transparent"
        } ${entering ? "" : "ease-rp transition-[top,box-shadow] duration-500"}`}
        style={{ top: fixed && !visible ? -120 : 0 }}
      >
        <header
          ref={rootRef}
          onFocus={reveal}
          className={`ease-rp relative mx-auto flex max-w-[1440px] items-center gap-[clamp(16px,2.8vw,40px)] px-(--rp-gutter) leading-[normal] text-white transition-[padding] duration-500 ${
            fixed ? "py-3" : "py-5"
          }`}
        >
          <Slant
            as="a"
            href="#main"
            size={8}
            className="bg-lime absolute top-2 -left-[9999px] z-[70] px-4 py-3 text-[14px] font-semibold text-green-950 focus:left-4"
          >
            {t("skipToContent")}
          </Slant>

          <Link href="/" aria-label={t("home")} className="block shrink-0">
            <Image
              src="/logo.svg"
              alt=""
              width={95}
              height={40}
              priority
              className="rp-logo block h-10 w-auto"
            />
          </Link>

          {/* Desktop (≥960px) */}
          <nav
            aria-label={t("mainMenu")}
            className="hidden min-w-0 flex-1 flex-nowrap min-[960px]:flex"
          >
            {items.map((item) => {
              const isActive = item.key === active;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={isActive ? "true" : undefined}
                  className={`flex items-center gap-1.5 border-b-2 px-[clamp(6px,.9vw,12px)] pt-3 pb-2.5 text-[14px] font-medium whitespace-nowrap text-white hover:text-white ${
                    isActive ? "border-lime" : "border-transparent"
                  }`}
                >
                  {item.label}
                  {/* Opens the mega menu once RP-45 is in. */}
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                    <path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </Link>
              );
            })}
          </nav>
          <div className="hidden items-center gap-0.5 min-[960px]:flex">
            <LanguageSwitcher variant="compact" />
            <SearchButton />
            <FavoritesLink count={favoriteCount} />
            <Slant
              as={Link}
              href={CTA_HREF[cta]}
              prefetch={cta === "advisor" ? false : undefined}
              size={8}
              className="bg-lime hover:bg-lime-hover ml-4 flex items-center gap-2.5 py-4 pr-[22px] pl-6 text-[14px] font-semibold whitespace-nowrap text-green-950 transition-colors duration-300 hover:text-green-950"
            >
              <span>{t(cta === "deals" ? "ctaDeals" : "ctaAdvisor")}</span>
              <ArrowIcon size={12} />
            </Slant>
          </div>

          {/* Mobile (<960px) */}
          <div className="flex flex-1 items-center justify-end gap-[clamp(16px,2.8vw,40px)] min-[960px]:hidden">
            <FavoritesLink count={favoriteCount} />
            <SearchButton />
            <MobileMenu items={items} />
          </div>
        </header>
      </div>
    </div>
  );
}
