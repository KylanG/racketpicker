"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowIcon } from "@/components/ui/icons";
import { Slant } from "@/components/ui/slant";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import type { NavItem } from "./nav-types";

const MENU_DESKTOP_QUERY = "(min-width: 960px)";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 10 10"
      aria-hidden="true"
      className={`ease-rp transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    >
      <path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/**
 * Hamburger + full-screen menu (<960px). A modal <dialog>: the browser keeps focus
 * inside, makes the page inert, closes on Escape and returns focus to the hamburger.
 */
export function MobileMenu({ items }: { items: NavItem[] }) {
  const t = useTranslations("header");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const baseId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Rotating to desktop width closes the menu.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia(MENU_DESKTOP_QUERY);
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label={t("openMenu")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="bg-lime hover:bg-lime-hover grid size-11 shrink-0 cursor-pointer place-items-center text-green-950"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        aria-label={t("menu")}
        onClose={close}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-auto bg-green-950 p-0 text-white backdrop:bg-transparent open:flex open:flex-col"
      >
        <div className="flex items-center justify-between px-(--rp-gutter) py-5">
          <Link href="/" aria-label={t("home")} onClick={close} className="block shrink-0">
            <Image src="/logo.svg" alt="" width={95} height={40} className="block h-10 w-auto" />
          </Link>
          <button
            type="button"
            autoFocus
            aria-label={t("closeMenu")}
            onClick={close}
            className="grid size-11 cursor-pointer place-items-center border border-white/40 text-white hover:bg-white/10"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>
        </div>

        <nav aria-label={t("mainMenu")} className="flex flex-col px-(--rp-gutter) py-2">
          {items.map((item) => {
            const isOpen = expanded === item.key;
            const panelId = `${baseId}-${item.key}`;
            return (
              <div key={item.key} className="border-b border-white/14">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setExpanded(isOpen ? null : item.key)}
                  className="flex min-h-[60px] w-full cursor-pointer items-center justify-between p-0 text-left text-[20px] font-semibold text-white"
                >
                  {item.label}
                  <Chevron open={isOpen} />
                </button>
                <div
                  id={panelId}
                  hidden={!isOpen}
                  className="flex-col pb-3.5 [&:not([hidden])]:flex"
                >
                  {item.allHref && (
                    <Link
                      href={item.allHref}
                      onClick={close}
                      className="text-lime hover:text-lime flex min-h-12 items-center text-[16px] font-semibold"
                    >
                      {t("viewAll", { category: item.lower })}
                    </Link>
                  )}
                  {item.subs.map((sub) => (
                    <Link
                      key={sub.key}
                      href={sub.href}
                      onClick={close}
                      className="flex min-h-12 flex-col justify-center py-1 text-[16px] text-white hover:text-white"
                    >
                      <span>{sub.name}</span>
                      <span className="text-[13px] text-[#B7CBBC]">{sub.description}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4 px-(--rp-gutter) pt-6 pb-8">
          <LanguageSwitcher variant="menu" onNavigate={close} />
          <Slant
            as={Link}
            href="/advisor"
            // The advisor follows in its own ticket; no prefetch of a 404 until then.
            prefetch={false}
            size={8}
            onClick={close}
            className="flex min-h-[52px] items-center justify-center bg-white/12 text-[16px] font-semibold text-white hover:bg-white/20 hover:text-white"
          >
            {t("ctaAdvisorFree")}
          </Slant>
          {/* No slant here, as in the prototype. */}
          <Link
            href={{ pathname: "/", hash: "deals" }}
            onClick={close}
            className="bg-lime hover:bg-lime-hover flex min-h-[52px] items-center justify-center gap-2.5 text-[16px] font-semibold text-green-950 hover:text-green-950"
          >
            <span>{t("ctaDeals")}</span>
            <ArrowIcon size={12} />
          </Link>
        </div>
      </dialog>
    </>
  );
}
