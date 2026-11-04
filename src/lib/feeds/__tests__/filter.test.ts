import { describe, expect, it } from "vitest";
import { isPadelRacket } from "../filter";

describe("isPadelRacket", () => {
  it.each([
    ["Adidas Metalbone 2026 Padel Racket", "Padel > Rackets"],
    ["Kuikma Carbon 26 Control padelracket", "Sport > Padel > Rackets"],
    ["Bullpadel Vertex 04 2026", "Padel > Rackets"],
    ["Pala de pádel Nox AT10", null],
    ["Head Speed Pro", "Padelrackets"],
  ])("keeps %s", (title, category) => expect(isPadelRacket({ title, category })).toBe(true));

  it.each([
    ["Head Overgrip Prime 3-pack", "Padel > Accessoires"],
    ["Asics Gel-Padel Pro 5 padelschoen heren", "Sport > Padel > Schoenen"],
    ["Hardloopschoen Nike Pegasus 41", "Sport > Hardlopen > Schoenen"],
    ["Padel Racket Tas Adidas Multigame", "Sport > Padel > Tassen"],
    ["Tennisracket Wilson Pro Staff", "Tennis > Rackets"],
    ["Padelballen Head Pro 3 stuks", "Padel > Ballen"],
    ["Racket protector tape", "Padel > Accessoires"],
  ])("drops %s", (title, category) => expect(isPadelRacket({ title, category })).toBe(false));
});
