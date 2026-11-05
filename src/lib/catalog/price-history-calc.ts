/** Pure helpers for the price history chart (RP-24). No server-only imports: used by tests. */

export type HistoryRow = { recorded_on: string; price: number | string; stock_status: string };
export type HistoryPoint = { date: string; price: number };
export type HistoryRange = "90d" | "6m" | "1y";

export const HISTORY_RANGES: HistoryRange[] = ["90d", "6m", "1y"];
export const RANGE_DAYS: Record<HistoryRange, number> = { "90d": 90, "6m": 180, "1y": 365 };
/** Fewer distinct days than this shows the "Nog geen prijshistorie" state. */
export const MIN_HISTORY_DAYS = 7;

const AVAILABLE = new Set(["in_stock", "low_stock", "preorder", "unknown"]);
const DAY = 86_400_000;

export const dayNumber = (date: string) => Math.round(Date.parse(`${date}T00:00:00Z`) / DAY);

/** Lowest available price per day across all shops, oldest first. */
export function dailyLowest(rows: HistoryRow[]): HistoryPoint[] {
  const byDay = new Map<string, number>();
  for (const r of rows) {
    if (!AVAILABLE.has(r.stock_status)) continue;
    const price = Number(r.price);
    const prev = byDay.get(r.recorded_on);
    if (prev == null || price < prev) byDay.set(r.recorded_on, price);
  }
  return [...byDay]
    .map(([date, price]) => ({ date, price }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Points inside the range ending today (YYYY-MM-DD). */
export function inRange(
  points: HistoryPoint[],
  range: HistoryRange,
  today: string,
): HistoryPoint[] {
  const from = dayNumber(today) - RANGE_DAYS[range] + 1;
  return points.filter((p) => dayNumber(p.date) >= from);
}

export type HistoryStats = { now: number; lowest: number; average: number; highest: number };

export function historyStats(points: HistoryPoint[]): HistoryStats | null {
  if (points.length === 0) return null;
  const prices = points.map((p) => p.price);
  const sum = prices.reduce((a, b) => a + b, 0);
  return {
    now: prices.at(-1)!,
    lowest: Math.min(...prices),
    average: Math.round(sum / prices.length),
    highest: Math.max(...prices),
  };
}

/** Y-axis as in the design: €10 headroom rounded to €20, ticks every €20 (€40 when wide). */
export function yAxis(
  lowest: number,
  highest: number,
): { min: number; max: number; ticks: number[] } {
  const min = Math.max(0, Math.floor((lowest - 10) / 20) * 20);
  const max = Math.ceil((highest + 10) / 20) * 20;
  const step = max - min > 80 ? 40 : 20;
  const ticks: number[] = [];
  for (let v = min + step; v < max; v += step) ticks.push(v);
  return { min, max, ticks };
}

/**
 * Line and area paths in a 1000×300 viewBox. x follows the calendar from `start` to
 * `today`; days without data are bridged by the line.
 */
export function chartPaths(
  points: HistoryPoint[],
  start: string,
  today: string,
  min: number,
  max: number,
): { line: string; area: string; coords: { x: number; y: number }[] } {
  const d0 = dayNumber(start);
  const span = Math.max(1, dayNumber(today) - d0);
  const coords = points.map((p) => ({
    x: Math.round(((dayNumber(p.date) - d0) / span) * 10000) / 10,
    y: Math.round((300 - ((p.price - min) / (max - min || 1)) * 300) * 10) / 10,
  }));
  // A single price that still holds today: draw it flat up to today.
  const last = coords.at(-1);
  if (last && last.x < 1000) coords.push({ x: 1000, y: last.y });
  const line = coords.map((c, i) => `${i ? "L" : "M"}${c.x} ${c.y}`).join(" ");
  const area = coords.length ? `${line} L${coords.at(-1)!.x} 300 L${coords[0].x} 300 Z` : "";
  return { line, area, coords: coords.slice(0, points.length) };
}

export function addDays(date: string, days: number): string {
  return new Date((dayNumber(date) + days) * DAY).toISOString().slice(0, 10);
}
