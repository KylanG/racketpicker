"use client";

import { useLocale, useTranslations } from "next-intl";
import Script from "next/script";
import { useEffect, useRef } from "react";
import { intlLocale, type Locale } from "@/i18n/routing";
import { useConsent } from "@/lib/consent";

const BUSINESS_UNIT_ID = process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID;
/** TrustBox template; default "Carousel". Pick another in the Trustpilot dashboard. */
const TEMPLATE_ID = process.env.NEXT_PUBLIC_TRUSTPILOT_TEMPLATE_ID ?? "53aa8912dec7e10d38f59f36";
const TRUSTBOX_SCRIPT = "https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js";

type TrustpilotGlobal = { loadFromElement: (el: HTMLElement, force?: boolean) => void };

/**
 * Real reviews only: the official Trustpilot TrustBox. Rendered only when a business
 * unit is configured and the visitor accepted marketing cookies; otherwise the whole
 * section is left out (no placeholder or made-up quotes).
 */
export function TrustpilotReviews() {
  const t = useTranslations("home");
  const locale = useLocale() as Locale;
  const consent = useConsent("marketing");
  const ref = useRef<HTMLDivElement>(null);

  // The script initialises widgets on load; re-run when it was already loaded.
  useEffect(() => {
    const tp = (window as unknown as { Trustpilot?: TrustpilotGlobal }).Trustpilot;
    if (consent && ref.current && tp) tp.loadFromElement(ref.current, true);
  }, [consent]);

  if (!BUSINESS_UNIT_ID || !consent) return null;

  return (
    <section
      aria-labelledby="reviews-title"
      className="rp-container flex w-full flex-col gap-8 pt-[136px]"
    >
      <div className="flex flex-col gap-2">
        <p className="rp-eyebrow">{t("reviewsEyebrow")}</p>
        <h2 id="reviews-title" className="rp-h2">
          {t("reviewsTitle")}
        </h2>
      </div>
      <div
        ref={ref}
        className="trustpilot-widget"
        data-locale={intlLocale[locale]}
        data-template-id={TEMPLATE_ID}
        data-businessunit-id={BUSINESS_UNIT_ID}
        data-style-height="240px"
        data-style-width="100%"
        data-theme="light"
      >
        <a
          href={`https://${locale === "nl" ? "nl." : ""}trustpilot.com/review/racketpicker.com`}
          target="_blank"
          rel="noopener"
          className="rp-underline font-semibold"
        >
          Trustpilot
        </a>
      </div>
      <Script src={TRUSTBOX_SCRIPT} strategy="lazyOnload" />
    </section>
  );
}
