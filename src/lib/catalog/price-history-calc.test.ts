import { describe, expect, it } from "vitest";
import {
  addDays,
  chartPaths,
  dailyLowest,
  historyStats,
  inRange,
  yAxis,
} from "./price-history-calc";

describe("dailyLowest", () => {
  it("takes the lowest available price per day, oldest first", () => {
    expect(
      dailyLowest([
        { recorded_on: "2026-11-02", price: "199.95", stock_status: "in_stock" },
        { recorded_on: "2026-11-01", price: 210, stock_status: "in_stock" },
        { recorded_on: "2026-11-02", price: 189, stock_status: "out_of_stock" },
        { recorded_on: "2026-11-02", price: 195, stock_status: "low_stock" },
      ]),
    ).toEqual([
      { date: "2026-11-01", price: 210 },
      { date: "2026-11-02", price: 195 },
    ]);
  });
});

describe("inRange / historyStats", () => {
  const points = [
    { date: "2026-01-01", price: 300 },
    { date: "2026-09-01", price: 250 },
    { date: "2026-10-01", price: 230 },
    { date: "2026-11-05", price: 240 },
  ];
  it("keeps the days of the chosen range", () => {
    expect(inRange(points, "90d", "2026-11-05").map((p) => p.date)).toEqual([
      "2026-09-01",
      "2026-10-01",
      "2026-11-05",
    ]);
    expect(inRange(points, "1y", "2026-11-05")).toHaveLength(4);
  });
  it("computes now, lowest, average and highest", () => {
    expect(historyStats(inRange(points, "90d", "2026-11-05"))).toEqual({
      now: 240,
      lowest: 230,
      average: 240,
      highest: 250,
    });
    expect(historyStats([])).toBeNull();
  });
});

describe("yAxis", () => {
  it("rounds to €20 with headroom and ticks inside", () => {
    expect(yAxis(199, 279)).toEqual({ min: 180, max: 300, ticks: [220, 260] });
    expect(yAxis(100, 120)).toEqual({ min: 80, max: 140, ticks: [100, 120] });
  });
});

describe("chartPaths", () => {
  it("places points on the calendar and extends the last price to today", () => {
    const { line, area, coords } = chartPaths(
      [
        { date: "2026-11-01", price: 200 },
        { date: "2026-11-03", price: 100 },
      ],
      "2026-11-01",
      "2026-11-05",
      100,
      200,
    );
    expect(coords).toEqual([
      { x: 0, y: 0 },
      { x: 500, y: 300 },
    ]);
    expect(line).toBe("M0 0 L500 300 L1000 300");
    expect(area).toBe("M0 0 L500 300 L1000 300 L1000 300 L0 300 Z");
  });
});

it("addDays", () => {
  expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
});
