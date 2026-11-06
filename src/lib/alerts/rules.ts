/** When an alert mails (RP-33). Pure, for tests and the daily check. */
export type AlertKind = "price" | "stock";

export type ProductNow = {
  /** Lowest price among available offers; null when no shop has it in stock. */
  lowest: number | null;
};

export function shouldNotify(
  alert: { kind: AlertKind; target_price: number | null },
  now: ProductNow,
): boolean {
  if (now.lowest == null) return false;
  if (alert.kind === "stock") return true;
  return alert.target_price != null && now.lowest <= alert.target_price;
}

/** Valid target price from the form: whole or cents, between €1 and €10,000. */
export function parseTarget(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  if (!Number.isFinite(n) || n < 1 || n > 10_000) return null;
  return Math.round(n * 100) / 100;
}
