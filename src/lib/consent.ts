"use client";

import { useSyncExternalStore } from "react";

/**
 * Cookie consent as stored by the banner (RP-35) in localStorage `rp-cookies`:
 * `{ necessary: true, analytics: boolean, marketing: boolean, date: ISO }`.
 * Third-party scripts (analytics, Trustpilot, affiliate tracking) load only after consent.
 */
export type ConsentCategory = "analytics" | "marketing";

export const CONSENT_STORAGE_KEY = "rp-cookies";
/** Fired by the banner after saving, so open pages pick up the new choice. */
export const CONSENT_CHANGE_EVENT = "rp:consent-change";

export function hasConsent(category: ConsentCategory): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;
    const value = JSON.parse(raw) as Partial<Record<ConsentCategory, unknown>>;
    return value[category] === true;
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Whether the visitor consented to a category; false on the server and before hydration. */
export function useConsent(category: ConsentCategory): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hasConsent(category),
    () => false,
  );
}
