import { describe, expect, it } from "vitest";
import {
  CONSENT_VERSION,
  consentFromCookieHeader,
  googleConsentState,
  parseConsent,
  serializeConsent,
  type Consent,
} from "../consent-cookie";

const consent: Consent = {
  version: CONSENT_VERSION,
  analytics: true,
  marketing: false,
  date: "2026-11-04T17:30:00.000Z",
};

describe("consent cookie", () => {
  it("round-trips", () => expect(parseConsent(serializeConsent(consent))).toEqual(consent));

  it("rejects missing, malformed and outdated values", () => {
    expect(parseConsent(undefined)).toBeNull();
    expect(parseConsent("%7Bnope")).toBeNull();
    expect(parseConsent(serializeConsent({ ...consent, version: 0 }))).toBeNull();
    expect(
      parseConsent(encodeURIComponent(JSON.stringify({ ...consent, marketing: "yes" }))),
    ).toBeNull();
  });

  it("finds the cookie in a header among others", () => {
    const header = `NEXT_LOCALE=nl; rp-consent=${serializeConsent(consent)}; other=1`;
    expect(consentFromCookieHeader(header)).toEqual(consent);
    expect(consentFromCookieHeader("NEXT_LOCALE=nl")).toBeNull();
  });

  it("maps to Google Consent Mode v2, denied by default", () => {
    expect(googleConsentState(null)).toEqual({
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    expect(googleConsentState(consent)).toMatchObject({
      analytics_storage: "granted",
      ad_storage: "denied",
    });
  });
});
