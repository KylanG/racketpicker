import { describe, expect, it } from "vitest";
import { roundedPath, slantClipPath, slantPoints, slantPolygon } from "../slant";

describe("slant geometry", () => {
  it("cuts the top-left and bottom-right corners", () => {
    expect(slantPoints(200, 48, 8)).toEqual([
      [8, 0],
      [200, 0],
      [192, 48],
      [0, 48],
    ]);
  });

  it("matches the design's polygon fallback", () =>
    expect(slantPolygon(8)).toBe("polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)"));

  it("rounds each corner with a quadratic curve through the vertex", () => {
    const path = roundedPath(slantPoints(200, 48, 8), 6);
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
    expect(path.match(/Q/g)).toHaveLength(4);
    // Top edge: from the top-left vertex (8,0) the curve ends 6px towards (200,0).
    expect(path).toContain("Q8 0 14 0");
    // The curve through the top-right vertex starts 6px before it.
    expect(path).toContain("L194 0 Q200 0");
  });

  it("caps the radius at half of a short edge", () => {
    // Edge (0,0)→(4,0) is 4px long: radius may be at most 2px.
    expect(
      roundedPath(
        [
          [0, 0],
          [4, 0],
          [4, 4],
          [0, 4],
        ],
        6,
      ),
    ).toContain("M0 2 Q0 0 2 0");
  });

  it("produces a CSS path() value", () =>
    expect(slantClipPath(100, 40, 5)).toMatch(/^path\("M.* Z"\)$/));
});
