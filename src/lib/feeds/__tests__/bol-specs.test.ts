import { describe, expect, it } from "vitest";
import {
  fillEmpty,
  flattenSpecs,
  levelsFromPlayerType,
  parseBalance,
  parseLevels,
  parsePlayStyle,
  parseShape,
  parseWeight,
  racketSpecsFromBol,
  weightFromBol,
  type FlatSpec,
} from "../bol-specs";

const spec = (name: string, value: string): FlatSpec => ({ group: "", key: "", name, value });

describe("flattenSpecs", () => {
  it("flattens groups, joins value lists and drops empty values", () => {
    expect(
      flattenSpecs([
        {
          title: "Eigenschappen",
          specifications: [
            { key: "Weight", name: "Gewicht", values: "365 gram" },
            { key: "Level", name: "Speelniveau", values: ["Beginner", "Gevorderd"] },
            { key: "Empty", name: "Leeg", values: "" },
          ],
        },
      ]),
    ).toEqual([
      { group: "Eigenschappen", key: "Weight", name: "Gewicht", value: "365 gram" },
      { group: "Eigenschappen", key: "Level", name: "Speelniveau", value: "Beginner, Gevorderd" },
    ]);
  });
});

describe("parsers", () => {
  it("reads a weight range in grams or kilos, only for a plausible racket weight", () => {
    expect(parseWeight("360 - 375 gram")).toEqual({ min: 360, max: 375 });
    expect(parseWeight("0,365 kg")).toEqual({ min: 365, max: 365 });
    expect(parseWeight("1200 g")).toBeNull();
  });

  it("recognises shapes, balance, levels and play style in Dutch and English", () => {
    expect(parseShape("Druppelvorm")).toBe("teardrop");
    expect(parseShape("Diamant")).toBe("diamond");
    expect(parseShape("Rond")).toBe("round");
    expect(parseShape("Hybride")).toBe("hybrid");
    expect(parseBalance("Hoog")).toEqual({ balance: "high" });
    expect(parseBalance("265 mm")).toEqual({ mm: 265 });
    expect(parseLevels("Beginner, Gevorderd")).toEqual(["beginner", "advanced"]);
    expect(parsePlayStyle("Controle")).toBe("control");
    expect(parsePlayStyle("Power")).toBe("power");
    expect(parsePlayStyle("Controle en power")).toBe("all_round");
  });
});

describe("weightFromBol", () => {
  it("uses the exact weight when it fits bol's weight class, otherwise the class", () => {
    expect(
      weightFromBol([
        spec("Gewicht padelracket", "365-375 gram"),
        spec("Product gewicht", "370 g"),
      ]),
    ).toEqual({ min: 370, max: 370 });
    expect(
      weightFromBol([
        spec("Gewicht padelracket", "365-375 gram"),
        spec("Product gewicht", "320 g"),
      ]),
    ).toEqual({ min: 365, max: 375 });
    expect(
      weightFromBol([
        spec("Gewicht padelracket", "Tot 365 gram"),
        spec("Product gewicht", "355 kg"),
      ]),
    ).toEqual({ min: 355, max: 355 });
    expect(
      weightFromBol([
        spec("Gewicht padelracket", "Tot 365 gram"),
        spec("Product gewicht", "620 g"),
      ]),
    ).toBeNull();
    expect(weightFromBol([spec("Product gewicht", "0.3675 kg")])).toEqual({ min: 368, max: 368 });
  });
});

describe("racketSpecsFromBol", () => {
  it("maps the real bol fields and skips the ones we know but do not use", () => {
    const { mapped, unmapped } = racketSpecsFromBol([
      spec("Bladvorm", "Traanvormig"),
      spec("Gewicht padelracket", "365-375 gram"),
      spec("Soort foam", "Zacht"),
      spec("Type speler", "Recreatieve speler, Competitiespeler"),
      spec("Balansklasse", "Head heavy"),
      spec("Kleur", "Black"),
      spec("Type sport", "Tennis"),
      spec("Iets nieuws", "x"),
    ]);
    expect(mapped).toEqual({
      shape: "teardrop",
      weight_min_g: 365,
      weight_max_g: 375,
      core_material: "Zachte foam",
      levels: ["beginner", "intermediate", "advanced"],
      balance: "high",
      play_style: "all_round",
    });
    expect(unmapped).toEqual(["Iets nieuws"]);
  });

  it("derives the play style from the shape only when there is none", () => {
    expect(racketSpecsFromBol([spec("Bladvorm", "Rond")]).mapped.play_style).toBe("control");
    expect(racketSpecsFromBol([spec("Bladvorm", "Diamant")]).mapped.play_style).toBe("power");
  });

  it("reads tour players as pro", () => {
    expect(levelsFromPlayerType("Competitiespeler, Tourspeler")).toEqual(["advanced", "pro"]);
  });
});

describe("fillEmpty", () => {
  it("never overwrites hand-entered values and keeps a weight range together", () => {
    expect(
      fillEmpty(
        { shape: "round", levels: [], weight_min_g: 350, weight_max_g: null },
        { shape: "diamond", levels: ["beginner"], weight_min_g: 360, weight_max_g: 375 },
      ),
    ).toEqual({ levels: ["beginner"] });
    expect(fillEmpty(null, { balance: "low" })).toEqual({ balance: "low" });
  });

  it("corrects values bol wrote before, but not values changed by hand since", () => {
    expect(
      fillEmpty(
        { weight_min_g: 320, weight_max_g: 320, shape: "round" },
        { weight_min_g: 365, weight_max_g: 375, shape: "diamond" },
        { weight_min_g: 320, weight_max_g: 320, shape: "teardrop" },
      ),
    ).toEqual({ weight_min_g: 365, weight_max_g: 375 });
  });
});
