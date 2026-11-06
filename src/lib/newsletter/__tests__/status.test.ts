import { describe, expect, it } from "vitest";
import { hasUnknownNewsletterStatus } from "../status";

describe("hasUnknownNewsletterStatus", () => {
  it("only flags unknown statuses on the newsletter route", () => {
    expect(hasUnknownNewsletterStatus("/nl/nieuwsbrief/bevestigd")).toBe(false);
    expect(hasUnknownNewsletterStatus("/nl/nieuwsbrief/iets")).toBe(true);
    expect(hasUnknownNewsletterStatus("/nl/rackets/padel")).toBe(false);
  });
});
