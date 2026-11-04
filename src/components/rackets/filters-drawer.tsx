"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Slant } from "@/components/ui/slant";
import { FilterForm, type FilterPanelData } from "./filter-form";

const DESKTOP = "(min-width: 900px)";

/**
 * Below 900px the filters sit behind "Filters (n)" in a modal <dialog>: focus stays
 * inside, Escape closes, focus returns to the button.
 */
export function FiltersDrawer({
  data,
  action,
  total,
}: {
  data: FilterPanelData;
  action: string;
  total: number;
}) {
  const t = useTranslations("rackets.filters");
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const mq = matchMedia(DESKTOP);
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open]);

  return (
    <>
      <Slant
        as="button"
        type="button"
        size={8}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="bg-ink flex min-h-11 cursor-pointer items-center gap-2 px-4 text-[14px] font-semibold text-white min-[900px]:hidden"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        {data.activeCount > 0 ? t("openCount", { count: data.activeCount }) : t("open")}
      </Slant>

      <dialog
        ref={ref}
        aria-label={t("title")}
        onClose={() => setOpen(false)}
        className="text-ink fixed inset-0 m-0 ml-auto h-dvh max-h-none w-[min(420px,100vw)] max-w-none flex-col bg-white p-0 backdrop:bg-[rgb(0_10_4/0.5)] open:flex"
      >
        <div className="flex items-center justify-end px-5 pt-4">
          <button
            type="button"
            autoFocus
            aria-label={t("close")}
            onClick={() => setOpen(false)}
            className="border-border grid size-11 cursor-pointer place-items-center border"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto px-5 pb-4">
          <FilterForm data={data} idPrefix="drawer" action={action} />
        </div>
        <div className="border-border border-t p-5">
          <Slant
            as="button"
            type="button"
            size={8}
            onClick={() => setOpen(false)}
            className="bg-lime hover:bg-lime-hover flex min-h-12 w-full cursor-pointer items-center justify-center text-[15px] font-semibold text-green-950"
          >
            {t("showResults", { count: total })}
          </Slant>
        </div>
      </dialog>
    </>
  );
}
