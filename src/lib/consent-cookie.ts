/**
 * Cookie consent, stored in the first-party cookie `rp-consent` (strictly necessary, so
 * it may be set without consent). Readable on the server and the client.
 * Shared by the banner (RP-35), useConsent() and anything that loads third-party scripts.
 */
export type ConsentCategory = "analytics" | "marketing";

export type Consent = {
  /** Bump to ask everyone again, e.g. when a new category or vendor is added. */
  version: number;
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp of the choice. */
  date: string;
};

export const CONSENT_COOKIE = "rp-consent";
export const CONSENT_VERSION = 1;
/** Ask again after 12 months. */
export const CONSENT_MAX_AGE_S = 60 * 60 * 24 * 365;

export function serializeConsent(consent: Consent): string {
  return encodeURIComponent(JSON.stringify(consent));
}

/** Parses the cookie value; null when missing, malformed or from an older version. */
export function parseConsent(value: string | undefined | null): Consent | null {
  if (!value) return null;
  try {
    const raw = JSON.parse(decodeURIComponent(value)) as Partial<Consent>;
    if (raw.version !== CONSENT_VERSION) return null;
    if (typeof raw.analytics !== "boolean" || typeof raw.marketing !== "boolean") return null;
    if (typeof raw.date !== "string" || Number.isNaN(Date.parse(raw.date))) return null;
    return {
      version: raw.version,
      analytics: raw.analytics,
      marketing: raw.marketing,
      date: raw.date,
    };
  } catch {
    return null;
  }
}

/** Reads `rp-consent` from a Cookie header or `document.cookie`. */
export function consentFromCookieHeader(header: string | undefined | null): Consent | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === CONSENT_COOKIE) return parseConsent(rest.join("="));
  }
  return null;
}

/**
 * Google Consent Mode v2 state for a choice (for GA4/Ads, RP-63). Without a choice every
 * signal is "denied".
 */
export function googleConsentState(consent: Consent | null) {
  const analytics = consent?.analytics ? "granted" : "denied";
  const marketing = consent?.marketing ? "granted" : "denied";
  return {
    analytics_storage: analytics,
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing,
  } as const;
}
