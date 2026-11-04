import { intlLocale, type Locale } from "@/i18n/routing";

/**
 * Prices as in the design: "€96,74", and "€279" for whole euros.
 * Intl formats per market; for nl the space between € and the amount is dropped to
 * match the handover. Other markets keep their own convention (es: "96,74 €").
 */
export function formatPrice(value: number, locale: Locale = "nl", currency = "EUR"): string {
  const whole = Number.isInteger(value);
  const parts = new Intl.NumberFormat(intlLocale[locale], {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).formatToParts(value);

  const currencyFirst = parts.findIndex((p) => p.type === "currency") === 0;
  return parts
    .filter((p, i) => !(locale === "nl" && currencyFirst && i === 1 && p.type === "literal"))
    .map((p) => p.value)
    .join("");
}

/** Difference between two prices, rounded to cents (avoids 0.1 + 0.2 float noise). */
export function priceDifference(a: number, b: number): number {
  return Math.round((a - b) * 100) / 100;
}
