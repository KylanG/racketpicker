"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";

const DURATION = 800;
const STAGGER_STEP = 70;
const STAGGER_MAX = 8;
const EASE = "cubic-bezier(.22,1,.36,1)";
const KEYFRAMES: Keyframe[] = [
  { opacity: 0, transform: "translateY(18px)" },
  { opacity: 1, transform: "none" },
];

type RevealProps = {
  /** Animate the direct children one after another (grids). */
  stagger?: boolean;
  children: ReactNode;
} & ComponentPropsWithoutRef<"div">;

/**
 * The one calm movement of the brand: fade in and 18px up, 800ms, when scrolled into view.
 * Content is visible without JS and with prefers-reduced-motion; elements already in view
 * on load are not hidden first, so there is no flash.
 */
export function Reveal({ stagger = false, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = stagger ? (Array.from(el.children) as HTMLElement[]) : [el];
    const rect = el.getBoundingClientRect();
    if (rect.top < innerHeight && rect.bottom > 0) return; // already visible: no animation

    targets.forEach((t) => (t.style.opacity = "0"));
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        targets.forEach((t, i) => {
          t.style.opacity = "";
          t.animate(KEYFRAMES, {
            duration: DURATION,
            easing: EASE,
            delay: stagger ? Math.min(i, STAGGER_MAX) * STAGGER_STEP : 0,
            fill: "backwards",
          });
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [stagger]);

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
}
