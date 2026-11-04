/**
 * Geometry for the brand's slanted shapes (design/handoff/README.md, "Schuine randen").
 * A slant is a parallelogram: the top-left and bottom-right corners are cut by `size` px.
 * Every corner is rounded with a quadratic curve of `radius` px (6px in the design).
 */

export const SLANT_RADIUS = 6;

/** Sizes used in the design: buttons/tabs 8, labels 5, footer input 12, search 14, big CTAs 32. */
export type SlantSize = 5 | 8 | 10 | 12 | 14 | 32;

type Point = readonly [number, number];

export function slantPoints(width: number, height: number, size: number): Point[] {
  return [
    [size, 0],
    [width, 0],
    [width - size, height],
    [0, height],
  ];
}

/** Plain polygon, used before hydration and as no-JS fallback (no rounded corners). */
export function slantPolygon(size: number): string {
  return `polygon(${size}px 0, 100% 0, calc(100% - ${size}px) 100%, 0 100%)`;
}

const n = (v: number) => Number(v.toFixed(2));

/**
 * SVG path with every corner rounded: for each vertex, stop `r` px before it, curve
 * through the vertex, continue `r` px after it. `r` is capped at half the edge length.
 */
export function roundedPath(points: Point[], radius = SLANT_RADIUS): string {
  const toward = (from: Point, to: Point): Point => {
    const dx = from[0] - to[0];
    const dy = from[1] - to[1];
    const length = Math.hypot(dx, dy) || 1;
    const r = Math.min(radius, length / 2);
    return [to[0] + (dx / length) * r, to[1] + (dy / length) * r];
  };

  const segments = points.map((vertex, i) => {
    const prev = points[(i - 1 + points.length) % points.length]!;
    const next = points[(i + 1) % points.length]!;
    const a = toward(prev, vertex);
    const b = toward(next, vertex);
    return `${i ? "L" : "M"}${n(a[0])} ${n(a[1])} Q${n(vertex[0])} ${n(vertex[1])} ${n(b[0])} ${n(b[1])}`;
  });
  return `${segments.join(" ")} Z`;
}

/** `clip-path` value for an element of the given size. */
export function slantClipPath(width: number, height: number, size: number, radius = SLANT_RADIUS) {
  return `path("${roundedPath(slantPoints(width, height, size), radius)}")`;
}
