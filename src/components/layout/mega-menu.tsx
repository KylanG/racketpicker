"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ArrowIcon } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import { ADVISOR_LIVE } from "@/lib/features";
import type { HeaderActive, NavItem } from "./nav-types";

/** Delays against flicker when the pointer crosses the gap between item and panel. */
const OPEN_DELAY = 120;
const CLOSE_DELAY = 220;

/**
 * Desktop main menu with mega menu (design/handoff/Header.dc.html; RP-45).
 * Opens on hover (with a short delay) and on click; closes on Escape, a click outside or
 * leaving the menu. Left: the sub-categories (per sport) and the advisor block; right:
 * brand columns with models of the sub that is hovered or focused.
 */
export function MegaMenu({ items, active }: { items: NavItem[]; active: HeaderActive }) {
  const t = useTranslations("header");
  const baseId = useId();
  const [open, setOpen] = useState<string | null>(null);
  const [sub, setSub] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const show = (key: string, delay = OPEN_DELAY) => {
    clear();
    timer.current = setTimeout(() => {
      setOpen((current) => {
        if (current !== key) setSub(0);
        return key;
      });
    }, delay);
  };
  const hide = (delay = CLOSE_DELAY) => {
    clear();
    timer.current = setTimeout(() => setOpen(null), delay);
  };

  useEffect(() => clear, []);

  // Escape and clicks outside close the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const key = open;
      setOpen(null);
      buttons.current[key]?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  function onButtonKey(e: KeyboardEvent<HTMLButtonElement>, key: string) {
    if (e.key !== "ArrowDown") return;
    e.preventDefault();
    clear();
    setOpen(key);
    setSub(0);
    // Focus the first link once the panel is rendered.
    requestAnimationFrame(() =>
      document.getElementById(`${baseId}-${key}`)?.querySelector<HTMLAnchorElement>("a")?.focus(),
    );
  }

  return (
    <div
      ref={rootRef}
      className="hidden min-w-0 flex-1 min-[960px]:block"
      onPointerLeave={(e) => e.pointerType === "mouse" && hide()}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(null);
      }}
    >
      <nav aria-label={t("mainMenu")} className="flex flex-nowrap">
        <ul className="flex flex-nowrap">
          {items.map((item) => {
            const isOpen = open === item.key;
            const isActive = item.key === active;
            const panelId = `${baseId}-${item.key}`;
            const current = item.subs[Math.min(sub, item.subs.length - 1)];
            return (
              <li
                key={item.key}
                onPointerEnter={(e) => e.pointerType === "mouse" && show(item.key)}
              >
                <button
                  ref={(el) => {
                    buttons.current[item.key] = el;
                  }}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => {
                    clear();
                    setSub(0);
                    setOpen(isOpen ? null : item.key);
                  }}
                  onKeyDown={(e) => onButtonKey(e, item.key)}
                  className={`flex min-h-11 cursor-pointer items-center gap-1.5 border-b-2 px-[clamp(6px,.9vw,12px)] pt-3 pb-2.5 text-[14px] font-medium whitespace-nowrap text-white ${
                    isActive || isOpen ? "border-lime" : "border-transparent"
                  }`}
                >
                  {item.label}
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    aria-hidden="true"
                    className={`ease-rp transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  >
                    <path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </button>

                <div
                  id={panelId}
                  hidden={!isOpen}
                  onPointerEnter={clear}
                  className="shadow-menu rp-fade-in absolute inset-x-(--rp-gutter) top-[calc(100%-6px)] z-40 grid min-h-[440px] grid-cols-[minmax(220px,300px)_minmax(0,1fr)] bg-white text-[#0B2A17]"
                >
                  <div className="bg-surface flex flex-col gap-0.5 p-5">
                    <Link
                      href={item.allHref ?? item.href}
                      onClick={() => setOpen(null)}
                      className="border-border mb-2 flex items-center justify-between border-b px-3.5 pt-3 pb-4 text-[16px] font-semibold text-[#0B2A17] hover:text-green-800"
                    >
                      <span>{t("viewAll", { category: item.lower })}</span>
                      <ArrowIcon />
                    </Link>
                    <ul
                      aria-label={t("subMenu", { category: item.label })}
                      className="flex flex-col"
                    >
                      {item.subs.map((s, i) => (
                        <li key={s.key}>
                          <Link
                            href={s.href}
                            onPointerEnter={() => setSub(i)}
                            onFocus={() => setSub(i)}
                            onClick={() => setOpen(null)}
                            className={`ease-rp flex items-center justify-between gap-3 px-3.5 py-[11px] text-[#0B2A17] transition-colors duration-300 hover:text-[#0B2A17] ${
                              i === sub ? "bg-white" : ""
                            }`}
                          >
                            <span className="flex flex-col gap-0.5">
                              <span className="text-[15px] font-semibold">{s.name}</span>
                              <span className="text-muted text-[13px]">{s.description}</span>
                            </span>
                            <svg
                              width="8"
                              height="12"
                              viewBox="0 0 8 12"
                              aria-hidden="true"
                              className={`shrink-0 ${i === sub ? "opacity-100" : "opacity-0"}`}
                            >
                              <path
                                d="M2 2l4 4-4 4"
                                fill="none"
                                stroke="#033A19"
                                strokeWidth="1.8"
                              />
                            </svg>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {ADVISOR_LIVE && item.key === "rackets" && (
                      <Link
                        href="/advisor"
                        onClick={() => setOpen(null)}
                        className="mt-auto flex flex-col gap-1 bg-green-950 p-4 text-white hover:bg-green-900 hover:text-white"
                      >
                        <span className="text-lime text-[13px] font-semibold">{t("doubt")}</span>
                        <span className="text-[15px] font-semibold">{t("ctaAdvisorFree")}</span>
                      </Link>
                    )}
                  </div>

                  {current && (
                    <div className="flex flex-col gap-7 px-9 py-8">
                      <div className="flex flex-wrap items-baseline justify-between gap-4">
                        <p className="text-[24px] font-semibold tracking-[-0.2px]">
                          {current.name}
                        </p>
                        <Link
                          href={current.href}
                          onClick={() => setOpen(null)}
                          className="rp-underline text-[14px] font-semibold text-[#0B2A17] hover:text-[#0B2A17]"
                        >
                          {t("viewAll", { category: current.lower })}
                        </Link>
                      </div>
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-x-7 gap-y-8">
                        {current.brands.map((b) => (
                          <div key={b.name} className="flex flex-col gap-[9px]">
                            <Link
                              href={b.href}
                              onClick={() => setOpen(null)}
                              className="mb-1 text-[15px] font-bold text-[#0B2A17] hover:text-green-800"
                            >
                              {b.name}
                            </Link>
                            {b.items.map((m) => (
                              <a
                                key={m.href}
                                href={m.href}
                                onClick={() => setOpen(null)}
                                className="text-muted text-[14px] hover:text-green-950"
                              >
                                {m.label}
                              </a>
                            ))}
                            {b.count > b.items.length && (
                              <Link
                                href={b.href}
                                onClick={() => setOpen(null)}
                                className="mt-0.5 text-[14px] font-semibold text-green-800 hover:text-green-950"
                              >
                                {t("brandAll", { brand: b.name })}
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
