"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { Slant } from "@/components/ui/slant";
import { useFilterNavigation } from "./filter-context";

/* Grid width (RP-27): 2, 3 or 4 products per row on wide screens, remembered per viewer. */
const KEY = "rp-per-row";
const EVENT = "rp-per-row";
const VIEWS = [2, 3, 4] as const;
type PerRow = (typeof VIEWS)[number];

function readPerRow(): PerRow {
  try {
    const n = Number(localStorage.getItem(KEY));
    return (VIEWS as readonly number[]).includes(n) ? (n as PerRow) : 3;
  } catch {
    return 3;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const usePerRow = () => useSyncExternalStore(subscribe, readPerRow, () => 3 as PerRow);

function setPerRow(n: PerRow) {
  try {
    localStorage.setItem(KEY, String(n));
  } catch {
    // Private mode: the choice just isn't remembered.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** The results list; from 1200px wide it follows the chosen products per row. */
export function ResultsGrid({ children }: { children: ReactNode }) {
  const perRow = usePerRow();
  return (
    <ul
      style={{ "--per-row": perRow } as React.CSSProperties}
      className="grid grid-cols-1 gap-5 min-[560px]:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] min-[1200px]:grid-cols-[repeat(var(--per-row),minmax(0,1fr))]"
    >
      {children}
    </ul>
  );
}

/** "Weergave" buttons (wide screens only) and "Sorteer op". */
export function ResultsToolbar({
  sort,
  options,
  queryFor,
  labels,
}: {
  sort: string;
  options: { value: string; label: string }[];
  /** Query string for each sort value (filters kept, page reset). */
  queryFor: Record<string, string>;
  labels: { sort: string; view: string; perRow: Record<number, string> };
}) {
  const perRow = usePerRow();
  const { navigate } = useFilterNavigation();
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div
        role="group"
        aria-label={labels.view}
        className="border-line hidden border min-[1200px]:flex"
      >
        {VIEWS.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={perRow === n}
            aria-label={labels.perRow[n]}
            title={labels.perRow[n]}
            onClick={() => setPerRow(n)}
            className={`flex h-[38px] w-10 cursor-pointer items-center justify-center gap-0.5 transition-colors duration-200 ${
              perRow === n ? "bg-ink text-white" : "text-muted bg-white"
            }`}
          >
            {Array.from({ length: n }, (_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="block h-3.5 bg-current"
                style={{ width: n === 2 ? 7 : n === 3 ? 5 : 4 }}
              />
            ))}
          </button>
        ))}
      </div>
      <label className="text-muted flex items-center gap-2.5 text-[14px]">
        {labels.sort}
        <select
          value={sort}
          onChange={(e) => navigate(queryFor[e.target.value] ?? "")}
          className="border-line text-ink cursor-pointer border bg-white px-3 py-[9px] text-[14px] font-medium"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/** An active filter as a removable label; navigates without a full reload. */
export function FilterChip({
  label,
  query,
  removeLabel,
}: {
  label: string;
  query: string;
  removeLabel: string;
}) {
  const { navigate } = useFilterNavigation();
  return (
    <button
      type="button"
      onClick={() => navigate(query)}
      aria-label={removeLabel}
      className="bg-surface text-ink hover:bg-surface-2 flex cursor-pointer items-center gap-2 px-3 py-2 text-[13px] font-medium"
    >
      {label}
      <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
        <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </button>
  );
}

/** Plain link-like button that navigates to a query (e.g. "Wis alles"). */
export function QueryButton({ query, children }: { query: string; children: ReactNode }) {
  const { navigate } = useFilterNavigation();
  return (
    <button
      type="button"
      onClick={() => navigate(query)}
      className="cursor-pointer text-[13px] font-medium text-green-800 underline hover:text-green-950"
    >
      {children}
    </button>
  );
}

/**
 * "Meer laden" (RP-27): shows the next page below the current ones without moving the
 * scroll position, then moves focus to the first new product for keyboard users.
 */
export function LoadMore({
  query,
  focusId,
  children,
}: {
  query: string;
  focusId: string;
  children: ReactNode;
}) {
  const { navigate, pending } = useFilterNavigation();
  const target = useRef<string | null>(null);
  // Once the new results are in, focus the first new product.
  useEffect(() => {
    if (pending || !target.current) return;
    const el = document.getElementById(target.current);
    if (el) {
      el.focus({ preventScroll: true });
      target.current = null;
    }
  }, [pending]);
  return (
    <Slant
      as="button"
      size={8}
      type="button"
      onClick={() => {
        target.current = focusId;
        navigate(query);
      }}
      className="bg-surface hover:bg-surface-2 text-ink mt-1.5 cursor-pointer px-[30px] py-3.5 text-[15px] font-semibold"
    >
      {children}
    </Slant>
  );
}
