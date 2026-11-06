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

/**
 * Weight from bol (RP-83 step 2). "Gewicht padelracket" is a coarse class ("365-375 gram",
 * "Tot 365 gram"); "Product gewicht" is exact but often wrong (packaging, "363 kg"). The
 * exact weight is used when it fits the class, otherwise the class when it is a range.
 */
export function weightFromBol(specs: FlatSpec[]): { min: number; max: number } | null {
  const byName = (re: RegExp) => specs.find((s) => re.test(lower(s.name)))?.value;
  const klass = byName(/^gewicht padelracket$/);
  const exactText = byName(/^product gewicht \(onbespannen\)$/) ?? byName(/^product gewicht$/);
  // bol mixes up units ("363 kg"): any number that is a plausible racket weight in grams.
  const exact = exactText
    ? numbers(exactText)
        .map((n) => (n < 1 ? Math.round(n * 1000) : Math.round(n)))
        .find((n) => n >= 300 && n <= 400)
    : undefined;

  if (klass) {
    const v = lower(klass);
    const values = numbers(v).filter((n) => n >= 250 && n <= 450);
    const upTo = /\btot\b/.test(v);
    const from = /\bvanaf\b/.test(v);
    const lo = upTo ? 0 : Math.min(...values);
    const hi = from ? Infinity : Math.max(...values);
    if (values.length && exact !== undefined && exact >= lo && exact <= hi) {
      return { min: exact, max: exact };
    }
    if (values.length >= 2 && !upTo && !from) return { min: lo, max: hi };
    return null;
  }
  return exact !== undefined && exact >= 340 && exact <= 390 ? { min: exact, max: exact } : null;
}

/** bol's "Type speler" → levels: recreational covers beginners and intermediates. */
export function levelsFromPlayerType(value: string): PlayLevel[] {
  const v = lower(value);
  const levels = new Set<PlayLevel>();
  if (/recreati/.test(v)) {
    levels.add("beginner");
    levels.add("intermediate");
  }
  if (/competiti/.test(v)) levels.add("advanced");
  if (/tour|professio/.test(v)) levels.add("pro");
  return (["beginner", "intermediate", "advanced", "pro"] as const).filter((l) => levels.has(l));
}

const FOAM: Record<string, string> = {
  zacht: "Zachte foam",
  hard: "Harde foam",
  hybride: "Hybride foam",
};

/**
 * Play style follows from the head shape, as shops and brands describe it: round is
 * control, teardrop and hybrid all-round, diamond power. Only used when the source has
 * no play style of its own.
 */
export const STYLE_FROM_SHAPE: Record<RacketShape, PlayStyle> = {
  round: "control",
  teardrop: "all_round",
  hybrid: "all_round",
  diamond: "power",
};

type Rule = { match: RegExp; apply: (value: string, out: MappedSpecs) => boolean };

/** Which spec (by name or key) fills which column. First matching rule wins. */
const RULES: Rule[] = [
  {
    // Handled together by weightFromBol; listed so it does not count as unmapped.
    match: /gewicht|weight/,
    apply: () => true,
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
      // A balance point outside 200–320 mm is not a padel value: known, but unusable.
      return true;
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
    match: /soort foam/,
    apply: (v, out) => {
      const foam = FOAM[lower(v).trim()];
      if (foam) out.core_material = foam;
      return foam !== undefined;
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
    match: /slagvlak|oppervlak|face|buitenkant|cover/,
    apply: (v, out) => {
      out.face_material = v.slice(0, 80);
      return true;
    },
  },
  {
    match: /type speler/,
    apply: (v, out) => {
      const levels = levelsFromPlayerType(v);
      if (levels.length) out.levels = levels;
      return levels.length > 0;
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
    match: /speelstijl|play ?style/,
    apply: (v, out) => {
      const style = parsePlayStyle(v);
      if (style) out.play_style = style;
      return style !== null;
    },
  },
];

/**
 * bol specs we know and deliberately do not use: identification, packaging, sizes and
 * fields that are too unreliable (bol labels some padel rackets as tennis or for kids).
 */
const IGNORED =
  /^(ean|fabrikant naam|kleur|doelgroep|inclusief hoes|type sport|fabrieksgarantie termijn|aantal artikelen in verpakking|gripmaat|product (lengte|breedte|hoogte)|bladgrootte|bladmateriaal|verpakkingsinhoud|frame of bespannen|flexibiliteit racket|snarenpatroon|materiaal)$/;

/** Translates bol specs; `unmapped` lists spec names that no rule could use. */
export function racketSpecsFromBol(specs: FlatSpec[]): { mapped: MappedSpecs; unmapped: string[] } {
  const mapped: MappedSpecs = {};
  const unmapped: string[] = [];
  for (const s of specs) {
    if (IGNORED.test(lower(s.name).trim())) continue;
    const label = lower(`${s.name} ${s.key}`);
    const rule = RULES.find((r) => r.match.test(label));
    if (!rule || !rule.apply(s.value, mapped)) unmapped.push(s.name || s.key);
  }
  const weight = weightFromBol(specs);
  if (weight) {
    mapped.weight_min_g = weight.min;
    mapped.weight_max_g = weight.max;
  }
  if (!mapped.play_style && mapped.shape) mapped.play_style = STYLE_FROM_SHAPE[mapped.shape];
  return { mapped, unmapped };
}

type ExistingSpecs = { [K in keyof MappedSpecs]?: MappedSpecs[K] | null };

/**
 * The columns bol may write: empty ones, and ones that still hold what bol wrote last time
 * (`applied`), so a better mapping can correct earlier bol values. Anything else was
 * entered by hand and always wins. An empty levels array counts as empty.
 */
export function fillEmpty(
  existing: ExistingSpecs | null,
  mapped: MappedSpecs,
  applied: MappedSpecs = {},
): MappedSpecs {
  const out: MappedSpecs = {};
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  for (const [k, v] of Object.entries(mapped) as [
    keyof MappedSpecs,
    MappedSpecs[keyof MappedSpecs],
  ][]) {
    const current = existing?.[k];
    const empty =
      current === null || current === undefined || (Array.isArray(current) && current.length === 0);
    const ours = applied[k] !== undefined && same(current, applied[k]);
    if ((empty || ours) && v !== undefined && !same(current, v)) {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  // A weight range is one value: never combine a hand-entered minimum with bol's maximum.
  if ((out.weight_min_g === undefined) !== (out.weight_max_g === undefined)) {
    const editable = (k: "weight_min_g" | "weight_max_g") =>
      existing?.[k] == null || same(existing[k], applied[k]);
    if (editable("weight_min_g") && editable("weight_max_g")) {
      out.weight_min_g = mapped.weight_min_g;
      out.weight_max_g = mapped.weight_max_g;
    } else {
      delete out.weight_min_g;
      delete out.weight_max_g;
    }
  }
  return out;
}
