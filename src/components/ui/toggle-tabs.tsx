"use client";

import type { ReactNode } from "react";
import { Slant } from "./slant";

export type ToggleTab<V extends string> = { value: V; label: ReactNode; count?: number };

/**
 * Filter tabs (sport tabs, deal tabs, view switches): one is active.
 * They filter content on the same page, so they use `aria-pressed` buttons as in the
 * prototype rather than a tablist. For tabs that switch panels, see <TabPanels>.
 */
export function ToggleTabs<V extends string>({
  items,
  value,
  onChange,
  tone = "light",
  label,
}: {
  items: ToggleTab<V>[];
  value: V;
  onChange: (value: V) => void;
  /** dark = on the green hero (inactive white 10%), light = on white pages. */
  tone?: "dark" | "light";
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = item.value === value;
        const colors =
          tone === "dark"
            ? active
              ? "bg-lime text-green-950"
              : "bg-white/10 text-white hover:bg-white/20"
            : active
              ? "bg-green-950 text-white"
              : "bg-surface text-ink hover:bg-surface-hover";
        return (
          <Slant
            key={item.value}
            as="button"
            type="button"
            size={8}
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={`flex min-h-11 cursor-pointer items-center gap-2 px-[18px] py-2.5 text-[14px] font-medium transition-colors ${colors}`}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="text-[13px] opacity-70">{item.count}</span>
            )}
          </Slant>
        );
      })}
    </div>
  );
}
