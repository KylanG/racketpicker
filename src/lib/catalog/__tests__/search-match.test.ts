import { describe, expect, it } from "vitest";
import { matchSuggestions, type SearchEntry } from "../search-match";

const e = (name: string, brand: string): SearchEntry => ({ id: name, name, brand, href: "/" });
const index = [
  e("Adidas Metalbone 2026", "Adidas"),
  e("Adidas Match Black Lime 2026", "Adidas"),
  e("Kuikma Carbon 26 Power", "Kuikma"),
  e("Kuikma Carbon 26 Control", "Kuikma"),
  e("Cañón Pro", "Cañón"),
];

describe("matchSuggestions", () => {
  it("is empty for an empty query", () => expect(matchSuggestions(index, "  ")).toEqual([]));

  it("matches all words, case- and accent-insensitive", () => {
    expect(matchSuggestions(index, "carbon POWER").map((x) => x.name)).toEqual([
      "Kuikma Carbon 26 Power",
    ]);
    expect(matchSuggestions(index, "canon")).toHaveLength(1);
  });

  it("ranks matches at the start of the name first", () =>
    expect(matchSuggestions(index, "adidas m").map((x) => x.name)).toEqual([
      "Adidas Match Black Lime 2026",
      "Adidas Metalbone 2026",
    ]));

  it("limits the number of suggestions", () =>
    expect(matchSuggestions(index, "a", 2)).toHaveLength(2));
});
