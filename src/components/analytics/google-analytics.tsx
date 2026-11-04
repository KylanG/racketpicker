"use client";

import Script from "next/script";
import { validMeasurementId } from "@/lib/analytics/events";
import { googleConsentState } from "@/lib/consent-cookie";
import { useConsentChoice } from "@/lib/consent";

const MEASUREMENT_ID = validMeasurementId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);

/**
 * GA4 with Basic Consent Mode (RP-63): gtag.js is only requested after consent for
 * "Analytisch". Before that nothing is sent to Google, not even cookieless pings.
 * Set NEXT_PUBLIC_GA_MEASUREMENT_ID for Production only, so Preview does not measure.
 *
 * Page views of client-side navigations are sent by GA4's enhanced measurement
 * ("page changes based on browser history events", on by default).
 */
export function GoogleAnalytics() {
  const consent = useConsentChoice();
  if (!MEASUREMENT_ID || !consent?.analytics) return null;

  // The consent state is set before config, as Consent Mode v2 requires.
  const init = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', ${JSON.stringify(googleConsentState(consent))});
gtag('js', new Date());
gtag('config', '${MEASUREMENT_ID}', { allow_google_signals: false, allow_ad_personalization_signals: false });
`;

  return (
    <>
      <Script id="ga4-init" strategy="afterInteractive">
        {init}
      </Script>
      <Script
        id="ga4"
        src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
    </>
  );
}
