import type { RawRow, StockStatus } from "./types";

/** First non-empty value among candidate column names (case-insensitive). */
export function pick(row: RawRow, candidates: readonly string[]): string | null {
  for (const name of candidates) {
    const key = Object.keys(row).find((k) => k.trim().toLowerCase() === name.toLowerCase());
    const value = key ? row[key]?.trim() : undefined;
    if (value) return value;
  }
  return null;
}

/**
 * Parses "96,74", "96.74", "€ 1.299,00", "1,299.00", "96.74 EUR" to a number.
 * Returns null for empty or invalid input.
 */
export function parsePrice(input: string | null | undefined): number | null {
  if (!input) return null;
  let s = input.replace(/[^\d.,-]/g, "");
  if (!s) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) {
    // Comma is the decimal separator: drop thousands dots.
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

/** Keeps digits only; accepts GTIN-8/12/13/14, pads UPC-12 to EAN-13. */
export function normalizeGtin(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  if (![8, 12, 13, 14].includes(digits.length)) return null;
  if (/^0+$/.test(digits)) return null;
  return digits.length === 12 ? `0${digits}` : digits;
}

const IN_STOCK = /^(1|true|yes|ja|y|in[ _-]?stock|op voorraad|available|leverbaar)$/i;
const OUT_OF_STOCK =
  /^(0|false|no|nee|n|out[ _-]?of[ _-]?stock|uitverkocht|niet leverbaar|sold out)$/i;
const PREORDER = /pre[ -]?order|voorbestel/i;

/** Maps the many stock notations in feeds to our enum. A quantity can refine "in stock". */
export function parseStock(flag: string | null, quantity?: string | null): StockStatus {
  const qty = quantity != null && quantity !== "" ? Number(quantity) : null;
  if (flag && PREORDER.test(flag)) return "preorder";
  if (qty !== null && Number.isFinite(qty)) {
    if (qty <= 0) return "out_of_stock";
    if (qty <= 3) return "low_stock";
  }
  if (flag && IN_STOCK.test(flag.trim())) return "in_stock";
  if (flag && OUT_OF_STOCK.test(flag.trim())) return "out_of_stock";
  if (qty !== null && Number.isFinite(qty) && qty > 0) return "in_stock";
  return "unknown";
}

/** "1-3 werkdagen" → [1, 3]; "2" → [2, 2]; "24 uur" → [1, 1]; otherwise nulls. */
export function parseDeliveryDays(input: string | null): [number | null, number | null] {
  if (!input) return [null, null];
  const s = input.toLowerCase();
  if (/(24\s*u(ur)?|24\s*h|next day|morgen)/.test(s)) return [1, 1];
  const range = s.match(/(\d+)\s*(?:-|–|tot|to)\s*(\d+)/);
  if (range) return [Number(range[1]), Number(range[2])];
  const single = s.match(/(\d+)/);
  if (single) return [Number(single[1]), Number(single[1])];
  return [null, null];
}

/** Collapses whitespace and strips HTML tags/entities that leak into feed titles. */
export function cleanText(input: string | null): string | null {
  if (!input) return null;
  const s = input
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return s || null;
}

export function isHttpUrl(input: string | null): input is string {
  return !!input && /^https?:\/\//i.test(input);
}
