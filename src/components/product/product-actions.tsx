"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { createAlertAction, type AlertResult } from "@/lib/alerts/actions";
import { FavoriteToggle } from "@/components/catalog/favorite-toggle";

/** Heart next to the CTA, saved in the favourites (RP-53). */
export function ProductFavToggle({
  productId,
  name,
  label,
}: {
  productId: string;
  name: string;
  label: string;
}) {
  return (
    <FavoriteToggle
      productId={productId}
      name={name}
      label={label}
      className="border-border size-14! shrink-0 rounded-none! border-[1.5px]"
    />
  );
}

/**
 * Price or stock alert form (RP-33): stores a pending alert and mails a confirmation link.
 * The result is announced without moving focus.
 */
export function AlertForm({
  productId,
  defaultTarget,
  stock,
  labels,
  consent,
}: {
  productId: string;
  /** Suggested target price; null for a stock alert (no price field). */
  defaultTarget: number | null;
  stock: boolean;
  labels: { target: string; email: string; placeholder: string; submit: string };
  consent: ReactNode;
}) {
  const t = useTranslations("alerts.form");
  const [status, setStatus] = useState<AlertResult["status"] | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createAlertAction({
        productId,
        email: String(data.get("email") ?? ""),
        target: stock ? null : String(data.get("target") ?? ""),
        stock,
      }).catch(() => ({ status: "unavailable" as const }));
      setStatus(result.status);
    });
  }

  if (status === "sent") {
    return (
      <p role="status" className="text-[15px] font-semibold text-green-800">
        {t("sent")}
      </p>
    );
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
              required
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
          disabled={pending}
          className="cursor-pointer bg-green-950 px-5 py-3 text-[14px] font-semibold text-white disabled:cursor-wait disabled:opacity-70"
          style={{ clipPath: "polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)" }}
        >
          {pending ? t("sending") : labels.submit}
        </button>
      </form>
      <p aria-live="polite" className="text-[14px] font-semibold text-[#8A4B1F] empty:hidden">
        {status === "invalid" ? t("invalid") : status === "unavailable" ? t("unavailable") : null}
      </p>
      <p className="text-muted text-[13px] leading-normal">{consent}</p>
    </>
  );
}
