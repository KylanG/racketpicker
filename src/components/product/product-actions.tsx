"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { FavButton } from "@/components/ui/fav-button";

/** Heart next to the CTA. Storage follows with favourites (RP-53); local state for now. */
export function ProductFavToggle({ label }: { label: string }) {
  const [pressed, setPressed] = useState(false);
  return (
    <FavButton
      pressed={pressed}
      onToggle={() => setPressed(!pressed)}
      label={label}
      className="border-border size-14! shrink-0 rounded-none! border-[1.5px]"
    />
  );
}

/**
 * Price or stock alert form. Sending follows in RP-33; until then the form says so and
 * stores nothing, instead of pretending an alert was set.
 */
export function AlertForm({
  defaultTarget,
  stock,
  labels,
  consent,
}: {
  /** Suggested target price; null for a stock alert (no price field). */
  defaultTarget: number | null;
  stock: boolean;
  labels: { target: string; email: string; placeholder: string; submit: string; soon: string };
  consent: ReactNode;
}) {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <>
      <form onSubmit={onSubmit} className="flex flex-wrap gap-2">
        {!stock && defaultTarget != null && (
          <label className="border-border-strong flex w-[120px] items-center gap-1 border bg-white px-3 text-[15px]">
            <span aria-hidden="true">€</span>
            <input
              type="number"
              name="target"
              min={1}
              step={1}
              defaultValue={defaultTarget}
              aria-label={labels.target}
              className="text-ink w-full bg-transparent py-3 font-medium outline-0"
            />
          </label>
        )}
        <label className="flex min-w-[180px] flex-1">
          <span className="sr-only">{labels.email}</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder={labels.placeholder}
            className="border-border-strong text-ink placeholder:text-muted w-full border bg-white px-3.5 py-3 text-[15px] outline-0 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)]"
          />
        </label>
        <button
          type="submit"
          className="cursor-pointer bg-green-950 px-5 py-3 text-[14px] font-semibold text-white"
          style={{ clipPath: "polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)" }}
        >
          {labels.submit}
        </button>
      </form>
      {sent ? (
        <p role="status" className="text-[14px] font-semibold text-green-800">
          {labels.soon}
        </p>
      ) : (
        <p className="text-muted text-[13px] leading-normal">{consent}</p>
      )}
    </>
  );
}
