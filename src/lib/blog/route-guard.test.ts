import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { articleExists, articleFromPath, clearArticleCache } from "./route-guard";

describe("articleFromPath", () => {
  it("matches article urls only", () => {
    expect(articleFromPath("/nl/blog/welk-racket")).toEqual({ locale: "nl", slug: "welk-racket" });
    expect(articleFromPath("/nl/blog/welk-racket/")).toEqual({ locale: "nl", slug: "welk-racket" });
    expect(articleFromPath("/nl/blog")).toBeNull();
    expect(articleFromPath("/nl/blog/a/b")).toBeNull();
    expect(articleFromPath("/nl/rackets/padel")).toBeNull();
    expect(articleFromPath("/xx/blog/a")).toBeNull();
  });
});

describe("articleExists", () => {
  beforeEach(() => {
    clearArticleCache();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://db.example");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "pk");
  });
  afterEach(() => vi.unstubAllEnvs());

  const reply = (rows: unknown[], ok = true) =>
    vi.fn<typeof fetch>(async () => ({ ok, json: async () => rows }) as Response);

  it("asks Supabase and caches the answer", async () => {
    const f = reply([{ slug: "a" }]);
    expect(await articleExists("nl", "a", f, 0)).toBe(true);
    expect(await articleExists("nl", "a", f, 1000)).toBe(true);
    expect(f).toHaveBeenCalledTimes(1);
    expect(String(f.mock.calls[0]![0])).toContain("market_code=eq.nl&slug=eq.a");
  });

  it("returns false for unknown and invalid slugs", async () => {
    expect(await articleExists("nl", "b", reply([]), 0)).toBe(false);
    const f = reply([]);
    expect(await articleExists("nl", "Bad_Slug", f, 0)).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });

  it("fails open when Supabase errors", async () => {
    expect(await articleExists("nl", "c", reply([], false), 0)).toBe(true);
    const boom = vi.fn<typeof fetch>(async () => {
      throw new Error("down");
    });
    expect(await articleExists("nl", "d", boom, 0)).toBe(true);
  });
});
