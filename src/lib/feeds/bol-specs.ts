/**
 * Racket specifications from bol (RP-83). Pure part: flatten bol's specification groups
 * and translate what is unambiguous into racket_specs columns. Everything we do not
 * recognise is reported, so the mapping can be extended after looking at real data.
 */
import type { BolSpecificationGroup } from "./bol";

export type FlatSpec = { group: string; key: string; name: string; value: string };

export type RacketShape = "round" | "teardrop" | "diamond" | "hybrid";
export type RacketBalance = "low" | "medium" | "high";
export type PlayLevel = "beginner" | "intermediate" | "advanced" | "pro";
export type PlayStyle = "control" | "all_round" | "power";

/** Columns of racket_specs we can fill from bol. Absent = bol said nothing usable. */
export type MappedSpecs = {
  weight_min_g?: number;
  weight_max_g?: number;
  shape?: RacketShape;
  balance?: RacketBalance;
  balance_mm?: number;
  core_material?: string;
  face_material?: string;
  thickness_mm?: number;
  levels?: PlayLevel[];
  play_style?: PlayStyle;
};

export function flattenSpecs(groups: BolSpecificationGroup[]): FlatSpec[] {
  const out: FlatSpec[] = [];
  for (const g of groups) {
    for (const s of g.specifications ?? []) {
      const raw = Array.isArray(s.values) ? s.values.join(", ") : (s.values ?? "");
      const value = raw.trim();
      if (!value) continue;
      out.push({ group: g.title ?? "", key: s.key ?? "", name: s.name ?? "", value });
    }
  }
  return out;
}

const lower = (s: string) => s.toLowerCase();

/** Numbers in a text, with a decimal comma or point ("360 - 375 gram", "0,36 kg"). */
function numbers(text: string): number[] {
  return [...text.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(",", ".")));
}

/** Weight range in grams, only within what a padel racket weighs (250–450 g). */
export function parseWeight(value: string): { min: number; max: number } | null {
  const v = lower(value);
  const factor = /\bkg\b|kilo/.test(v) ? 1000 : 1;
  const grams = numbers(v)
    .map((n) => Math.round(n * factor))
    .filter((n) => n >= 250 && n <= 450);
  if (grams.length === 0) return null;
  return { min: Math.min(...grams), max: Math.max(...grams) };
}

export function parseShape(value: string): RacketShape | null {
  const v = lower(value);
  if (/hybri/.test(v)) return "hybrid";
  if (/diamant|diamond/.test(v)) return "diamond";
  if (/druppel|traan|tear/.test(v)) return "teardrop";
  if (/\brond|\bround/.test(v)) return "round";
  return null;
}

export function parseBalance(value: string): { balance?: RacketBalance; mm?: number } | null {
  const v = lower(value);
  const mm = numbers(v).find((n) => n >= 200 && n <= 320);
  let balance: RacketBalance | undefined;
  if (/laag|low|greep|handle|kop ?licht|head ?light/.test(v)) balance = "low";
  else if (/hoog|high|kop ?zwaar|head ?heavy/.test(v)) balance = "high";
  else if (/gemiddeld|medium|midden|neutraal|even|gebalanceerd/.test(v)) balance = "medium";
  if (!balance && mm === undefined) return null;
  return { ...(balance ? { balance } : {}), ...(mm !== undefined ? { mm: Math.round(mm) } : {}) };
}

export function parseLevels(value: string): PlayLevel[] {
  const v = lower(value);
  const levels = new Set<PlayLevel>();
  if (/beginn|starter/.test(v)) levels.add("beginner");
  if (/gemiddeld|intermediate|recreati/.test(v)) levels.add("intermediate");
  if (/gevorderd|advanced|ervaren/.test(v)) levels.add("advanced");
  if (/professio|\bpro\b|competiti|wedstrijd/.test(v)) levels.add("pro");
  return [...levels];
}

export function parsePlayStyle(value: string): PlayStyle | null {
  const v = lower(value);
  const control = /controle|control/.test(v);
  const power = /power|kracht|aanval|offensi/.test(v);
  if (/all ?-?round|veelzijdig/.test(v) || (control && power)) return "all_round";
  if (control) return "control";
  if (power) return "power";
  return null;
}

export function parseThickness(value: string): number | null {
  const mm = numbers(lower(value)).find((n) => n >= 30 && n <= 45);
  return mm ?? null;
}

type Rule = { match: RegExp; apply: (value: string, out: MappedSpecs) => boolean };

/** Which spec (by name or key) fills which column. First matching rule wins. */
const RULES: Rule[] = [
  {
    match: /gewicht|weight/,
    apply: (v, out) => {
      const w = parseWeight(v);
      if (!w) return false;
      out.weight_min_g = w.min;
      out.weight_max_g = w.max;
      return true;
    },
  },
  {
    match: /vorm|shape/,
    apply: (v, out) => {
      const shape = parseShape(v);
      if (shape) out.shape = shape;
      return shape !== null;
    },
  },
  {
    match: /balans|balance/,
    apply: (v, out) => {
      const b = parseBalance(v);
      if (b?.balance) out.balance = b.balance;
      if (b?.mm !== undefined) out.balance_mm = b.mm;
      return b !== null;
    },
  },
  {
    match: /dikte|thickness|profiel/,
    apply: (v, out) => {
      const mm = parseThickness(v);
      if (mm !== null) out.thickness_mm = mm;
      return mm !== null;
    },
  },
  {
    match: /kern|core|binnenkant|schuim/,
    apply: (v, out) => {
      out.core_material = v.slice(0, 80);
      return true;
    },
  },
  {
    match: /slagvlak|oppervlak|face|buitenkant|cover|blad/,
    apply: (v, out) => {
      out.face_material = v.slice(0, 80);
      return true;
    },
  },
  {
    match: /niveau|level/,
    apply: (v, out) => {
      const levels = parseLevels(v);
      if (levels.length) out.levels = levels;
      return levels.length > 0;
    },
  },
  {
    match: /speelstijl|speel ?type|play ?style|type speler/,
    apply: (v, out) => {
      const style = parsePlayStyle(v);
      if (style) out.play_style = style;
      return style !== null;
    },
  },
];

/** Translates bol specs; `unmapped` lists spec names that no rule could use. */
export function racketSpecsFromBol(specs: FlatSpec[]): { mapped: MappedSpecs; unmapped: string[] } {
  const mapped: MappedSpecs = {};
  const unmapped: string[] = [];
  for (const s of specs) {
    const label = lower(`${s.name} ${s.key}`);
    const rule = RULES.find((r) => r.match.test(label));
    if (!rule || !rule.apply(s.value, mapped)) unmapped.push(s.name || s.key);
  }
  return { mapped, unmapped };
}

type ExistingSpecs = { [K in keyof MappedSpecs]?: MappedSpecs[K] | null };

/**
 * Only the columns that are still empty: hand-entered specs always win over bol.
 * An empty levels array counts as empty.
 */
export function fillEmpty(existing: ExistingSpecs | null, mapped: MappedSpecs): MappedSpecs {
  const out: MappedSpecs = {};
  for (const [k, v] of Object.entries(mapped) as [
    keyof MappedSpecs,
    MappedSpecs[keyof MappedSpecs],
  ][]) {
    const current = existing?.[k];
    const empty =
      current === null || current === undefined || (Array.isArray(current) && current.length === 0);
    if (empty && v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  // A weight range is one value: never combine a hand-entered minimum with bol's maximum.
  if ((out.weight_min_g === undefined) !== (out.weight_max_g === undefined)) {
    delete out.weight_min_g;
    delete out.weight_max_g;
  }
  return out;
}
