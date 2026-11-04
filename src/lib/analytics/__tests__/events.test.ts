import { afterEach, describe, expect, it, vi } from "vitest";
import { analyticsCookieNames, trackEvent, validMeasurementId } from "../events";

describe("validMeasurementId", () => {
  it("accepts GA4 ids only", () => {
    expect(validMeasurementId("G-AB12CD34EF")).toBe("G-AB12CD34EF");
    expect(validMeasurementId("UA-123-1")).toBeNull();
    expect(validMeasurementId("G-x';alert(1)//")).toBeNull();
    expect(validMeasurementId(undefined)).toBeNull();
  });
});

describe("analyticsCookieNames", () => {
  it("finds the GA cookies and nothing else", () =>
    expect(
      analyticsCookieNames("rp-consent=x; _ga=GA1.1.1; _ga_AB12CD=GS1; _gid=1; _gat=1; galaxy=1"),
    ).toEqual(["_ga", "_ga_AB12CD", "_gid"]));
});

describe("trackEvent", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is a no-op without gtag (no consent)", () => {
    vi.stubGlobal("window", {});
    expect(() => trackEvent({ name: "sign_up", params: { method: "newsletter" } })).not.toThrow();
  });

  it("sends through gtag when loaded", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });
    trackEvent({ name: "search", params: { search_term: "metalbone" } });
    expect(gtag).toHaveBeenCalledWith("event", "search", {
      search_term: "metalbone",
      currency: "EUR",
    });
  });
});
