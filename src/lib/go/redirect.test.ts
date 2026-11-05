import { describe, expect, it } from "vitest";
import { goHref, isBot, safeTarget, sourcePath, validGoParams } from "./redirect";

const offer = "0b6b8f0e-5d3a-4c1e-9b7a-2f1d3c4b5a69";

describe("go redirect helpers", () => {
  it("builds and validates links", () => {
    expect(goHref("bol", offer)).toBe(`/go/bol/${offer}`);
    expect(validGoParams("bol", offer)).toBe(true);
    expect(validGoParams("Bol", offer)).toBe(false);
    expect(validGoParams("bol", "123")).toBe(false);
    expect(validGoParams("../x", offer)).toBe(false);
  });

  it("recognises bots and missing user agents", () => {
    expect(isBot(null)).toBe(true);
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("WhatsApp/2.23")).toBe(true);
    expect(
      isBot(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15",
      ),
    ).toBe(false);
  });

  it("only allows http(s) targets", () => {
    expect(safeTarget("https://partner.bol.com/click/click?s=1")).toBe(
      "https://partner.bol.com/click/click?s=1",
    );
    expect(safeTarget("javascript:alert(1)")).toBeNull();
    expect(safeTarget("not a url")).toBeNull();
    expect(safeTarget(null)).toBeNull();
  });

  it("keeps only our own path from the referer", () => {
    const own = "https://racketpicker.com";
    expect(sourcePath("https://racketpicker.com/nl/rackets/padel/x?merk=nox", own)).toBe(
      "/nl/rackets/padel/x",
    );
    expect(sourcePath("https://evil.example/nl", own)).toBeNull();
    expect(sourcePath(null, own)).toBeNull();
  });
});
