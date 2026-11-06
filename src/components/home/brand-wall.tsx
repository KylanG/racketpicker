"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Slant } from "@/components/ui/slant";
import { Link } from "@/i18n/navigation";
import {
  nextSwap,
  SWAP_FADE_MS,
  SWAP_INTERVAL_MS,
  VISIBLE_BRANDS,
} from "@/lib/home/brand-rotation";
import type { NavHref } from "@/components/layout/nav-types";

/** `logo`: public path of a one-colour SVG (RP-56); without it the name is shown. */
export type WallBrand = { slug: string; name: string; href: NavHref; logo?: string | null };

type Phase = "in" | "out" | "pre";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (onChange: () => void) => {
  const mq = matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
/** Reduced motion; treated as "reduce" on the server so nothing moves before hydration. */
const useReducedMotion = () =>
  useSyncExternalStore(
    subscribeMotion,
    () => matchMedia(REDUCED_MOTION).matches,
    () => true,
  );

/**
 * Merkenblok: 12 brands at a time; every 2.2 s one slot fades to another brand.
 * WCAG 2.2.2: a pause button (its label says what it will do), and the rotation also pauses on hover, on keyboard focus
 * and when the tab is hidden. No rotation with reduced motion or with ≤ 12 brands.
 */
export function BrandWall({ brands }: { brands: WallBrand[] }) {
  const t = useTranslations("home");
  const rotates = brands.length > VISIBLE_BRANDS;
  const [slots, setSlots] = useState(() => brands.slice(0, VISIBLE_BRANDS).map((_, i) => i));
  const [phase, setPhase] = useState<{ slot: number; phase: Phase } | null>(null);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const hold = useRef(false);
  const lastSlot = useRef<number | null>(null);
  const slotsRef = useRef(slots);

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    if (!rotates || paused || reducedMotion) return;
    const timers: number[] = [];
    const interval = window.setInterval(() => {
      if (document.hidden || hold.current) return;
      const swap = nextSwap(slotsRef.current, brands.length, lastSlot.current);
      if (!swap) return;
      lastSlot.current = swap.slot;
      setPhase({ slot: swap.slot, phase: "out" });
      timers.push(
        window.setTimeout(() => {
          setSlots((s) => s.map((b, i) => (i === swap.slot ? swap.brand : b)));
          setPhase({ slot: swap.slot, phase: "pre" });
          timers.push(window.setTimeout(() => setPhase({ slot: swap.slot, phase: "in" }), 40));
        }, SWAP_FADE_MS),
      );
    }, SWAP_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
      timers.forEach(window.clearTimeout);
    };
  }, [rotates, paused, reducedMotion, brands.length]);

  const style = (slot: number) => {
    const p = phase?.slot === slot ? phase.phase : "in";
    return {
      opacity: p === "in" ? 1 : 0,
      transform: p === "out" ? "translateY(-14px)" : p === "pre" ? "translateY(14px)" : "none",
      transition:
        p === "pre"
          ? "none"
          : `opacity ${SWAP_FADE_MS}ms var(--ease-rp), transform ${SWAP_FADE_MS}ms var(--ease-rp)`,
    };
  };

  return (
    <div
      className="flex flex-col gap-5"
      onMouseEnter={() => (hold.current = true)}
      onMouseLeave={() => (hold.current = false)}
      onFocus={() => (hold.current = true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hold.current = false;
      }}
    >
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(max(140px,calc((100%-72px)/4)),1fr))] gap-x-6 gap-y-14 py-6">
        {slots.map((index, slot) => {
          const brand = brands[index]!;
          return (
            <li key={slot}>
              <Link
                href={brand.href}
                className="grid h-16 place-items-center overflow-hidden text-center text-[22px] font-bold tracking-[-0.3px] text-[#9FB3A5] uppercase transition-colors duration-[250ms] hover:text-white"
              >
                {brand.logo ? (
                  // The SVG is a mask filled with the text colour, so it turns white on
                  // hover like the names; the name stays for screen readers.
                  <span className="block" style={style(slot)}>
                    <span
                      aria-hidden="true"
                      className="block h-11 w-[150px] bg-current"
                      style={{
                        maskImage: `url(${brand.logo})`,
                        maskRepeat: "no-repeat",
                        maskPosition: "center",
                        maskSize: "contain",
                      }}
                    />
                    <span className="sr-only">{brand.name}</span>
                  </span>
                ) : (
                  <span className="block" style={style(slot)}>
                    {brand.name}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      {rotates && !reducedMotion && (
        <Slant
          as="button"
          type="button"
          size={5}
          onClick={() => setPaused((p) => !p)}
          className="text-on-dark flex min-h-11 cursor-pointer items-center gap-2 self-end bg-white/8 px-3.5 text-[13px] font-medium hover:bg-white/16 hover:text-white"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d={paused ? "M3 1.5v9l7.5-4.5z" : "M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z"} />
          </svg>
          {paused ? t("brandsPlay") : t("brandsPause")}
        </Slant>
      )}
    </div>
  );
}
