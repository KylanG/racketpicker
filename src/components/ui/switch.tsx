"use client";

import { useId, type ReactNode } from "react";

/**
 * On/off switch from the handover (42×24, square knob, no rounding).
 * `role="switch"` + `aria-checked`; the visible <label> names it and toggles it on click.
 */
export function Switch({
  checked,
  onChange,
  children,
  tone = "light",
  disabled = false,
  describedBy,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  tone?: "light" | "dark";
  /** Locked, e.g. "Noodzakelijk" in the cookie settings. */
  disabled?: boolean;
  /** Id of an element with a longer description. */
  describedBy?: string;
}) {
  const id = useId();
  const track =
    tone === "dark"
      ? checked
        ? "bg-lime"
        : "bg-white/25"
      : checked
        ? "bg-green-950"
        : "bg-[#C9D6C4]";
  return (
    <span className="inline-flex min-h-11 items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={describedBy}
        id={id}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`flex h-6 w-[42px] shrink-0 cursor-pointer p-[3px] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${track} ${checked ? "justify-end" : "justify-start"}`}
      >
        <span className="block size-[18px] bg-white" />
      </button>
      <label htmlFor={id} className={`text-[14px] ${disabled ? "" : "cursor-pointer"}`}>
        {children}
      </label>
    </span>
  );
}
