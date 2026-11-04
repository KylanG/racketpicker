/** Brands visible at once in the merkenblok (4×3). */
export const VISIBLE_BRANDS = 12;
/** One slot changes every 2.2 s; the fade itself takes 600 ms (design/handoff/README.md). */
export const SWAP_INTERVAL_MS = 2200;
export const SWAP_FADE_MS = 600;

/**
 * Picks the next swap: a slot other than the previous one, and a brand that is not on
 * screen. Returns null when every brand is already visible.
 */
export function nextSwap(
  slots: number[],
  total: number,
  lastSlot: number | null,
  random: () => number = Math.random,
): { slot: number; brand: number } | null {
  const visible = new Set(slots);
  const hidden = Array.from({ length: total }, (_, i) => i).filter((i) => !visible.has(i));
  if (hidden.length === 0 || slots.length === 0) return null;
  const candidates = slots.map((_, i) => i).filter((i) => i !== lastSlot || slots.length === 1);
  const slot = candidates[Math.floor(random() * candidates.length)]!;
  const brand = hidden[Math.floor(random() * hidden.length)]!;
  return { slot, brand };
}
