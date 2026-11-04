"use client";

import { useSyncExternalStore } from "react";
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_S,
  CONSENT_VERSION,
  consentFromCookieHeader,
  serializeConsent,
  type Consent,
  type ConsentCategory,
} from "./consent-cookie";

export type { Consent, ConsentCategory } from "./consent-cookie";

/** Fired after the choice is saved, so open pages pick it up. */
export const CONSENT_CHANGE_EVENT = "rp:consent-change";

/** The visitor's current choice, or null when there is none (yet). */
export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  return consentFromCookieHeader(document.cookie);
}

export function hasConsent(category: ConsentCategory): boolean {
  return readConsent()?.[category] === true;
}

/** Saves the choice in `rp-consent` (12 months) and notifies listeners. */
export function saveConsent(choice: Pick<Consent, ConsentCategory>): Consent {
  const consent: Consent = { version: CONSENT_VERSION, ...choice, date: new Date().toISOString() };
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(consent)}; Max-Age=${CONSENT_MAX_AGE_S}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
  return consent;
}

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
}

// document.cookie is a fresh string on every read: compare by value to keep snapshots stable.
let lastRaw: string | null = null;
let lastConsent: Consent | null = null;
function snapshot(): Consent | null {
  const raw = document.cookie;
  if (raw !== lastRaw) {
    lastRaw = raw;
    const next = consentFromCookieHeader(raw);
    if (JSON.stringify(next) !== JSON.stringify(lastConsent)) lastConsent = next;
  }
  return lastConsent;
}

/** The current choice; null on the server, before hydration and without a choice. */
export function useConsentChoice(): Consent | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

/** Whether the visitor consented to a category; false on the server and before hydration. */
export function useConsent(category: ConsentCategory): boolean {
  return useConsentChoice()?.[category] === true;
}
