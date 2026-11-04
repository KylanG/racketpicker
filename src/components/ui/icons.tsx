import type { SVGProps } from "react";

/*
 * Brand-specific icons drawn exactly as in the handover. General icons come from
 * lucide-react (stroke 1.6–1.8), e.g. `import { Search } from "lucide-react"`.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/** ↗ arrow; spins on hover/focus of the parent link or button (globals.css). */
export function ArrowIcon({ size = 12, ...props }: IconProps) {
  return (
    <svg data-arrow width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" {...props}>
      <path d="M4 10L10 4M5 4h5v5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function CheckIcon({ size = 10, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true" {...props}>
      <path d="M1.5 5l2.5 2.5 4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function CloseIcon({ size = 9, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true" {...props}>
      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function HeartIcon({
  size = 16,
  filled = false,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"
        fill={filled ? "var(--color-lime)" : "none"}
        stroke="var(--color-green-950)"
        strokeWidth="2"
      />
    </svg>
  );
}

export function BellIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
      {...props}
    >
      <path d="M10 2.5a5 5 0 015 5v3.5l1.5 2.5h-13L5 11V7.5a5 5 0 015-5zM8 16a2 2 0 004 0" />
    </svg>
  );
}

export function SearchIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}
