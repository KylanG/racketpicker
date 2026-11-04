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
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  tone?: "light" | "dark";
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
        id={id}
        onClick={() => onChange(!checked)}
        className={`flex h-6 w-[42px] shrink-0 cursor-pointer p-[3px] transition-colors duration-200 ${track} ${checked ? "justify-end" : "justify-start"}`}
      >
        <span className="block size-[18px] bg-white" />
      </button>
      <label htmlFor={id} className="cursor-pointer text-[14px]">
        {children}
      </label>
    </span>
  );
}
