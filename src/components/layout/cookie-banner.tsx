"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Slant } from "@/components/ui/slant";
import { Switch } from "@/components/ui/switch";
import { Link } from "@/i18n/navigation";
import {
  clearAnalyticsCookies,
  readConsent,
  saveConsent,
  useConsentChoice,
  type ConsentCategory,
} from "@/lib/consent";
import { OPEN_COOKIE_SETTINGS_EVENT } from "./cookie-settings-button";

type Draft = Record<ConsentCategory, boolean>;

const noop = () => () => {};
/** True after hydration; the banner never renders on the server (pages stay static). */
const useMounted = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

const BUTTON =
  "flex min-h-12 min-w-[160px] flex-1 cursor-pointer items-center justify-center px-4 text-[15px] font-semibold whitespace-nowrap transition-colors duration-300";

/**
 * Cookie banner (design/handoff/Footer.dc.html): a card bottom left.
 * - First visit: non-modal, so the page stays usable; nothing optional loads until a choice.
 * - "Alles accepteren" and "Alleen noodzakelijk" are equally large and both solid.
 * - "Cookie-instellingen" in the footer reopens it modally with the switches; Escape
 *   closes it without changing anything and focus returns to the footer button.
 * - Withdrawing a consent reloads the page, so scripts that were loaded are gone; the
 *   GA4 cookies are removed as well.
 */
export function CookieBanner() {
  const t = useTranslations("cookies");
  const mounted = useMounted();
  const consent = useConsentChoice();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [reopened, setReopened] = useState(false);
  const [settings, setSettings] = useState(false);
  const [draft, setDraft] = useState<Draft>({ analytics: false, marketing: false });

  const firstVisit = mounted && consent === null;
  const open = firstVisit || reopened;

  useEffect(() => {
    const onOpen = () => {
      const current = readConsent();
      setDraft({ analytics: current?.analytics ?? false, marketing: current?.marketing ?? false });
      setSettings(true);
      setReopened(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    if (reopened && !dialog.matches(":modal")) {
      if (dialog.open) dialog.close();
      dialog.showModal();
    } else if (!dialog.open) {
      // Not show(): that moves focus into the banner on page load. Setting the attribute
      // opens it without taking focus; it is first in the tab order instead.
      dialog.setAttribute("open", "");
    }
  }, [open, reopened]);

  const save = (choice: Draft) => {
    const before = readConsent();
    saveConsent(choice);
    setReopened(false);
    setSettings(false);
    const withdrawn =
      (before?.analytics && !choice.analytics) || (before?.marketing && !choice.marketing);
    if (before?.analytics && !choice.analytics) clearAnalyticsCookies();
    if (withdrawn) window.location.reload();
  };

  if (!mounted) return null;

  const categories: { key: "necessary" | ConsentCategory; locked?: boolean }[] = [
    { key: "necessary", locked: true },
    { key: "analytics" },
    { key: "marketing" },
  ];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // Escape on the reopened (modal) banner: close without changing the choice.
      onCancel={(e) => {
        if (!reopened) e.preventDefault();
        else setReopened(false);
      }}
      onClose={() => setReopened(false)}
      className="shadow-cookie text-ink fixed inset-auto bottom-[clamp(12px,3vw,32px)] left-[clamp(12px,3vw,32px)] z-[95] m-0 max-h-[calc(100dvh-24px)] w-[min(560px,calc(100vw-24px))] flex-col gap-4 overflow-auto bg-white p-[clamp(20px,3vw,28px)] backdrop:bg-[rgb(0_10_4/0.5)] open:flex"
    >
      <div className="flex items-center gap-3">
        <Slant size={5} className="bg-lime grid size-10 shrink-0 place-items-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="var(--color-green-950)"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <path d="M17.5 10.5A7.5 7.5 0 119.5 2.5a3 3 0 003.5 3.5 3 3 0 004.5 4.5z" />
            <circle cx="7" cy="8" r=".9" fill="var(--color-green-950)" />
            <circle cx="11" cy="13" r=".9" fill="var(--color-green-950)" />
            <circle cx="7" cy="13" r=".9" fill="var(--color-green-950)" />
          </svg>
        </Slant>
        <h2 id={titleId} className="text-[20px] font-semibold">
          {t("title")}
        </h2>
      </div>

      <p className="text-muted text-[15px] leading-[1.55]">
        {t.rich("text", {
          link: (chunks) => (
            <Link href="/privacy" prefetch={false} className="text-ink underline">
              {chunks}
            </Link>
          ),
        })}
      </p>

      {settings && (
        <ul className="border-line flex flex-col border-t">
          {categories.map(({ key, locked }) => {
            const descId = `${titleId}-${key}`;
            const checked = locked ? true : draft[key as ConsentCategory];
            return (
              <li
                key={key}
                className="border-line flex items-center justify-between gap-4 border-b py-3.5"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-semibold" aria-hidden="true">
                    {t(`categories.${key}.title`)}
                  </span>
                  <span id={descId} className="text-muted text-[13px] leading-[1.45]">
                    {t(`categories.${key}.description`)}
                  </span>
                </div>
                <Switch
                  checked={checked}
                  disabled={locked}
                  describedBy={descId}
                  onChange={(value) => setDraft((d) => ({ ...d, [key]: value }))}
                >
                  <span className="sr-only">{t(`categories.${key}.title`)}</span>
                </Switch>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-2.5">
        {settings && (
          <Slant
            as="button"
            type="button"
            size={8}
            onClick={() => save(draft)}
            className={`${BUTTON} bg-surface text-ink hover:bg-surface-hover basis-full`}
          >
            {t("save")}
          </Slant>
        )}
        <Slant
          as="button"
          type="button"
          size={8}
          onClick={() => save({ analytics: true, marketing: true })}
          className={`${BUTTON} bg-lime hover:bg-lime-hover text-green-950`}
        >
          {t("acceptAll")}
        </Slant>
        <Slant
          as="button"
          type="button"
          size={8}
          onClick={() => save({ analytics: false, marketing: false })}
          className={`${BUTTON} bg-green-950 text-white hover:bg-green-800`}
        >
          {t("necessaryOnly")}
        </Slant>
      </div>

      {!settings && (
        <button
          type="button"
          onClick={() => setSettings(true)}
          className="text-ink cursor-pointer self-start py-1 text-[14px] font-medium underline"
        >
          {t("customize")}
        </button>
      )}
      {reopened && (
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="text-muted cursor-pointer self-start py-1 text-[14px] underline"
        >
          {t("close")}
        </button>
      )}
    </dialog>
  );
}
