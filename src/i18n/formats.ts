import type { Formats } from "next-intl";

/**
 * Shared formats, used via `format.number(value, "price")` / `format.dateTime(date, "short")`.
 * nl: € 96,74 · 1.234 · 4 nov 2026
 */
export const formats = {
  number: {
    price: { style: "currency", currency: "EUR" },
    integer: { maximumFractionDigits: 0 },
  },
  dateTime: {
    short: { day: "numeric", month: "short", year: "numeric" },
  },
} satisfies Formats;
