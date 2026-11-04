"use client";

import { HeartIcon } from "./icons";

/**
 * Round 44px heart (favourite). Storage comes with RP-53; this is the control only.
 * `label` names the product, e.g. "Bewaar Adidas Metalbone 2026".
 */
export function FavButton({
  pressed,
  onToggle,
  label,
  className = "",
}: {
  pressed: boolean;
  onToggle: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onToggle}
      className={`grid size-11 cursor-pointer place-items-center rounded-full bg-white transition-transform hover:scale-105 ${className}`}
    >
      <HeartIcon filled={pressed} />
    </button>
  );
}
