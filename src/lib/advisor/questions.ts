/**
 * The advisor's five questions (design/handoff/Keuzehulp.dc.html; RP-49). Pure: shared
 * by the quiz (client), the outcome pages and the tests. Answer values are the URL values,
 * in the same style as the racket filters (`niveau`, `stijl`).
 */
import { SPORTS, type SportKey } from "@/lib/catalog/taxonomy";

export const ADVISOR_LEVELS = ["beginner", "gevorderd", "competitie"] as const;
export const ADVISOR_STYLES = ["controle", "allround", "power"] as const;
export const FREQUENCIES = ["af-en-toe", "wekelijks", "vaak", "dagelijks"] as const;
export const BUDGETS = ["tot-75", "75-150", "150-250", "250-plus"] as const;

export type AdvisorLevel = (typeof ADVISOR_LEVELS)[number];
export type AdvisorStyle = (typeof ADVISOR_STYLES)[number];
export type Frequency = (typeof FREQUENCIES)[number];
export type Budget = (typeof BUDGETS)[number];

/** Price range per budget answer, in euros. */
export const BUDGET_RANGE: Record<Budget, [number, number]> = {
  "tot-75": [0, 75],
  "75-150": [75, 150],
  "150-250": [150, 250],
  "250-plus": [250, Infinity],
};

export type StepKey = "sport" | "niveau" | "stijl" | "frequentie" | "budget";
export const STEP_KEYS: StepKey[] = ["sport", "niveau", "stijl", "frequentie", "budget"];

export type Answers = {
  sport?: SportKey;
  niveau?: AdvisorLevel;
  stijl?: AdvisorStyle;
  frequentie?: Frequency;
  budget?: Budget;
};
export type CompleteAnswers = Required<Answers>;

const OPTIONS: Record<Exclude<StepKey, "sport">, readonly string[]> = {
  niveau: ADVISOR_LEVELS,
  stijl: ADVISOR_STYLES,
  frequentie: FREQUENCIES,
  budget: BUDGETS,
};

/** Options per step; the sport step only offers sports that have rackets. */
export function stepOptions(step: StepKey, sports: readonly SportKey[]): readonly string[] {
  return step === "sport"
    ? SPORTS.map((s) => s.key).filter((k) => sports.includes(k))
    : OPTIONS[step];
}

/**
 * The steps to ask. With only one sport with rackets the sport question is skipped
 * (its answer is that sport), so the bar shows four segments.
 */
export function activeSteps(sports: readonly SportKey[]): StepKey[] {
  return sports.length > 1 ? STEP_KEYS : STEP_KEYS.slice(1);
}

type Params = Record<string, string | string[] | null | undefined>;
const one = (v: Params[string]) => (Array.isArray(v) ? v[0] : (v ?? undefined));

/** Valid answers from the URL; unknown values are dropped. */
export function parseAnswers(params: Params, sports: readonly SportKey[]): Answers {
  const a: Answers = {};
  for (const step of STEP_KEYS) {
    const v = one(params[step]);
    if (v && stepOptions(step, sports).includes(v)) (a as Record<string, string>)[step] = v;
  }
  if (sports.length === 1) a.sport = sports[0];
  return a;
}

export function isComplete(a: Answers): a is CompleteAnswers {
  return STEP_KEYS.every((k) => a[k] != null);
}

/**
 * Step on screen: `stap` from the URL (1-based, set by "Vorige" and by editing a label),
 * else the first open question.
 */
export function currentStep(params: Params, answers: Answers, steps: StepKey[]): number {
  const asked = Number(one(params.stap));
  if (Number.isInteger(asked) && asked >= 1 && asked <= steps.length) {
    // Never further than the first open question.
    const open = steps.findIndex((k) => answers[k] == null);
    return open === -1 ? asked - 1 : Math.min(asked - 1, open);
  }
  const open = steps.findIndex((k) => answers[k] == null);
  return open === -1 ? steps.length - 1 : open;
}

/** Query string for the quiz page: the answers plus the step to show. */
export function quizQuery(a: Answers, steps: StepKey[], step: number): Record<string, string> {
  const q: Record<string, string> = {};
  for (const k of steps) if (a[k]) q[k] = a[k]!;
  q.stap = String(step + 1);
  return q;
}

/** Outcome page profile segment: `beginner-controle`. */
export const profileSlug = (a: Pick<CompleteAnswers, "niveau" | "stijl">) =>
  `${a.niveau}-${a.stijl}`;

export function parseProfile(profile: string): Pick<CompleteAnswers, "niveau" | "stijl"> | null {
  const i = profile.lastIndexOf("-");
  const niveau = profile.slice(0, i) as AdvisorLevel;
  const stijl = profile.slice(i + 1) as AdvisorStyle;
  return ADVISOR_LEVELS.includes(niveau) && ADVISOR_STYLES.includes(stijl)
    ? { niveau, stijl }
    : null;
}
