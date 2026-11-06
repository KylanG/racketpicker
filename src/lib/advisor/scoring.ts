/**
 * Advisor scoring (design/handoff/README.md §6; RP-50). Pure and tested.
 *
 * Points: base 30; level 30 exact / 14 one level apart; style 25 exact / 8 when either
 * side is allround; budget 25 within / 12 below / 8 up to 1.25× above; frequency +8.
 * Match % = raw / max × 98, with max 118 when all answers are known. On the outcome
 * page without frequency or budget those parts drop out of both raw and max.
 * Ties: cheapest first. Only rackets in stock with a price take part.
 */
import type { Level, RacketItem } from "@/lib/catalog/racket-filters";
import {
  ADVISOR_LEVELS,
  BUDGET_RANGE,
  FREQUENCIES,
  type AdvisorLevel,
  type AdvisorStyle,
  type Budget,
  type Frequency,
} from "./questions";

export type ScoreInput = {
  niveau: AdvisorLevel;
  stijl: AdvisorStyle;
  frequentie?: Frequency;
  budget?: Budget;
};

/** Reasons shown under a racket; labels in messages (advisor.result.why.*). */
export type Reason = "level" | "style" | "inBudget" | "belowBudget" | "intensive";

export type Match = {
  item: RacketItem;
  raw: number;
  percent: number;
  reasons: Reason[];
};

/**
 * Catalog levels on the advisor's three-step scale: "gemiddeld" and "gevorderd" both
 * count as the advisor's "gevorderd" (regular player who knows the technique).
 */
const LEVEL_RANK: Record<Level, number> = {
  beginner: 0,
  gemiddeld: 1,
  gevorderd: 1,
  competitie: 2,
};

export function scoreRacket(item: RacketItem, a: ScoreInput): Omit<Match, "item"> {
  let raw = 30;
  let max = 30 + 30 + 25;
  const reasons: Reason[] = [];

  const wanted = ADVISOR_LEVELS.indexOf(a.niveau);
  const ranks = item.levels.map((l) => LEVEL_RANK[l]);
  if (ranks.length) {
    const d = Math.min(...ranks.map((r) => Math.abs(r - wanted)));
    if (d === 0) {
      raw += 30;
      reasons.push("level");
    } else if (d === 1) raw += 14;
  }

  if (item.style) {
    if (item.style === a.stijl) {
      raw += 25;
      reasons.push("style");
    } else if (item.style === "allround" || a.stijl === "allround") raw += 8;
  }

  if (a.budget) {
    max += 25;
    const [lo, hi] = BUDGET_RANGE[a.budget];
    const price = item.price ?? Infinity;
    if (price >= lo && price <= hi) {
      raw += 25;
      reasons.push("inBudget");
    } else if (price < lo) {
      raw += 12;
      reasons.push("belowBudget");
    } else if (price <= hi * 1.25) raw += 8;
  }

  if (a.frequentie && ranks.length) {
    max += 8;
    const often = FREQUENCIES.indexOf(a.frequentie) >= 2;
    // Frequent players: a racket for regular players or up; others: up to that level.
    if (often && Math.max(...ranks) >= 1) {
      raw += 8;
      reasons.push("intensive");
    } else if (!often && Math.min(...ranks) <= 1) raw += 8;
  } else if (a.frequentie) max += 8;

  return { raw, percent: Math.round((raw / max) * 98), reasons };
}

export function rankRackets(items: RacketItem[], a: ScoreInput & { sport: string }): Match[] {
  return items
    .filter((i) => i.sport === a.sport && i.inStock && i.price != null)
    .map((item) => ({ item, ...scoreRacket(item, a) }))
    .sort((x, y) => y.raw - x.raw || x.item.price! - y.item.price!);
}
