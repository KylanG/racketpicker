/**
 * GA4 events (RP-63). One typed list, so every place reports the same names and params.
 * Sending only happens after consent for "Analytisch"; without it trackEvent() is a no-op.
 */
export type AnalyticsEvent =
  /** Click through to a shop (RP-52). */
  | {
      name: "select_shop";
      params: { shop: string; product_id: string; price: number; position: number };
    }
  /** Newsletter sign-up (RP-32). */
  | { name: "sign_up"; params: { method: "newsletter" } }
  /** Price or stock alert (RP-33). */
  | { name: "price_alert"; params: { product_id: string; kind: "price" | "stock" } }
  /** Advisor finished (RP-49/50). */
  | { name: "advisor_complete"; params: { sport: string } }
  /** Search submitted or a suggestion opened (RP-46, hero search). */
  | { name: "search"; params: { search_term: string } };

type Gtag = (command: "event", name: string, params: Record<string, unknown>) => void;

export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  // gtag only exists once the GA4 tag was loaded, which happens only after consent.
  gtag?.("event", event.name, { ...event.params, currency: "EUR" });
}

/** GA4 measurement IDs look like G-XXXXXXX; anything else is ignored. */
export function validMeasurementId(id: string | undefined): string | null {
  return id && /^G-[A-Z0-9]{4,20}$/.test(id) ? id : null;
}

/** Names of the cookies GA4 sets (_ga, _ga_<id>), for removal after withdrawal. */
export function analyticsCookieNames(cookieHeader: string): string[] {
  return cookieHeader
    .split(";")
    .map((c) => c.trim().split("=")[0] ?? "")
    .filter((name) => name === "_ga" || name.startsWith("_ga_") || name === "_gid");
}
