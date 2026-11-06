import { describe, expect, it } from "vitest";
import { racketFromPath, brandFromPath } from "../route-guard";

describe("racketFromPath", () => {
  it("recognises racket and accessory product URLs", () => {
    expect(racketFromPath("/nl/rackets/padel/nox-at10")).toEqual({
      locale: "nl",
      sport: "padel",
      slug: "nox-at10",
      category: "rackets",
    });
    expect(racketFromPath("/nl/accessoires/padel/head-pro-s")).toMatchObject({
      category: "accessories",
      slug: "head-pro-s",
    });
    expect(racketFromPath("/nl/accessoires/padel")).toBeNull();
    expect(racketFromPath("/nl/keuzehulp/padel/beginner-controle")).toBeNull();
    expect(racketFromPath("/nl/accessoires/voetbal/x")).toBeNull();
  });
});

describe("brandFromPath", () => {
  it("reads the brand slug from /{locale}/merken/{brand}", () => {
    expect(brandFromPath("/nl/merken/bullpadel")).toEqual({ locale: "nl", slug: "bullpadel" });
    expect(brandFromPath("/nl/merken/nox/")).toEqual({ locale: "nl", slug: "nox" });
  });

  it("ignores other routes and the overview", () => {
    expect(brandFromPath("/nl/merken")).toBeNull();
    expect(brandFromPath("/nl/marcas/nox")).toBeNull();
    expect(brandFromPath("/nl/rackets/padel")).toBeNull();
  });
});
