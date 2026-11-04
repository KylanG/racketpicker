import { describe, expect, it } from "vitest";
import { availabilityFromRows } from "../nav-availability";

const rows = [
  { category_key: "rackets", sport_key: "tennis", is_sample: false },
  { category_key: "rackets", sport_key: "padel", is_sample: false },
  { category_key: "shoes", sport_key: "padel", is_sample: true },
  { category_key: "rackets", sport_key: "curling", is_sample: false },
  { category_key: "unknown", sport_key: "padel", is_sample: false },
];

describe("availabilityFromRows", () => {
  it("keeps taxonomy order and drops unknown keys", () =>
    expect(availabilityFromRows(rows, true)).toEqual({
      rackets: ["padel", "tennis"],
      shoes: ["padel"],
    }));

  it("hides categories that only have sample products", () =>
    expect(availabilityFromRows(rows, false)).toEqual({ rackets: ["padel", "tennis"] }));

  it("is empty without rows", () => expect(availabilityFromRows([], true)).toEqual({}));
});
