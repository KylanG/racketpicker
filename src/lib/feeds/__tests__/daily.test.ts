import { describe, expect, it, vi } from "vitest";

// images.ts imports the admin client; the pure helpers under test do not touch it.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));

const { imageExtension, pickImagesToSync } = await import("../images");
const { isAuthorizedCronRequest } = await import("../../cron");

describe("isAuthorizedCronRequest", () => {
  it("accepts the exact bearer token", () =>
    expect(isAuthorizedCronRequest("Bearer s3cret", "s3cret")).toBe(true));
  it.each([null, "Bearer wrong", "s3cret", "Bearer s3cret "])("rejects %s", (header) =>
    expect(isAuthorizedCronRequest(header, "s3cret")).toBe(false),
  );
  it("stays closed without a configured secret", () =>
    expect(isAuthorizedCronRequest("Bearer ", "")).toBe(false));
});

describe("imageExtension", () => {
  it.each([
    ["image/jpeg", "jpg"],
    ["image/png; charset=binary", "png"],
    ["IMAGE/WEBP", "webp"],
    ["text/html", null],
    [null, null],
  ])("%s → %s", (type, ext) => expect(imageExtension(type)).toBe(ext));
});

describe("pickImagesToSync", () => {
  const candidates = [
    { productId: "a", imageUrl: "https://x/a1.jpg", title: "A" },
    { productId: "a", imageUrl: "https://x/a2.jpg", title: "A" },
    { productId: "b", imageUrl: "https://x/b.jpg", title: "B" },
    { productId: "c", imageUrl: "https://x/c.jpg", title: "C" },
  ];

  it("takes one photo per product and skips products that have one", () => {
    expect(pickImagesToSync(candidates, new Set(["b"]), 10).map((c) => c.imageUrl)).toEqual([
      "https://x/a1.jpg",
      "https://x/c.jpg",
    ]);
  });

  it("respects the per-run limit", () =>
    expect(pickImagesToSync(candidates, new Set(), 1)).toHaveLength(1));
});
