import { describe, expect, it } from "vitest";
import { hasUnknownLinkStatus } from "../status";

describe("hasUnknownLinkStatus", () => {
  it("only flags unknown statuses on the newsletter route", () => {
    expect(hasUnknownLinkStatus("/nl/nieuwsbrief/bevestigd")).toBe(false);
    expect(hasUnknownLinkStatus("/nl/nieuwsbrief/iets")).toBe(true);
    expect(hasUnknownLinkStatus("/nl/prijsalert/afgemeld")).toBe(false);
    expect(hasUnknownLinkStatus("/nl/prijsalert/x")).toBe(true);
    expect(hasUnknownLinkStatus("/nl/rackets/padel")).toBe(false);
  });
});
