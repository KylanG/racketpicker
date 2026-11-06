import { describe, expect, it } from "vitest";
import { parseFavorites } from "./store";

const A = "9e2f4b67-83d7-45d6-9a6c-8dfdb9184d9b";
const B = "b5924d30-6f29-4326-9c67-c0ebdb9d9168";

describe("parseFavorites", () => {
  it("reads IDs, also from the prototype's objects, without duplicates", () => {
    expect(parseFavorites(JSON.stringify([A, { id: B }, A]))).toEqual([A, B]);
  });
  it("ignores broken or odd values", () => {
    expect(parseFavorites(null)).toEqual([]);
    expect(parseFavorites("{nope")).toEqual([]);
    expect(parseFavorites(JSON.stringify({ a: 1 }))).toEqual([]);
    expect(parseFavorites(JSON.stringify(["adidas-metalbone", 3, null]))).toEqual([]);
  });
});
