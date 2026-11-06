import { describe, expect, it } from "vitest";
import {
  fillEmpty,
  flattenSpecs,
  parseBalance,
  parseLevels,
  parsePlayStyle,
  parseShape,
  parseWeight,
  racketSpecsFromBol,
} from "../bol-specs";

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

describe("racketSpecsFromBol", () => {
  it("maps known specs and reports the rest", () => {
    const { mapped, unmapped } = racketSpecsFromBol([
      { group: "", key: "", name: "Gewicht", value: "360-375 g" },
      { group: "", key: "", name: "Vorm", value: "Diamant" },
      { group: "", key: "", name: "Kernmateriaal", value: "EVA Soft" },
      { group: "", key: "", name: "Kleur", value: "Zwart" },
      { group: "", key: "", name: "Balans", value: "onbekend" },
    ]);
    expect(mapped).toEqual({
      weight_min_g: 360,
      weight_max_g: 375,
      shape: "diamond",
      core_material: "EVA Soft",
    });
    expect(unmapped).toEqual(["Kleur", "Balans"]);
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
});
