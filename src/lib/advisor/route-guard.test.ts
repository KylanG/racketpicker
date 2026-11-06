import { describe, expect, it } from "vitest";
import { hasUnknownAdvisorProfile } from "./route-guard";

describe("hasUnknownAdvisorProfile", () => {
  it("flags unknown profiles on outcome pages only", () => {
    expect(hasUnknownAdvisorProfile("/nl/keuzehulp/padel/pro-snel")).toBe(true);
    expect(hasUnknownAdvisorProfile("/nl/keuzehulp/padel/beginner-controle")).toBe(false);
    expect(hasUnknownAdvisorProfile("/nl/rackets/padel/pro-snel")).toBe(false);
    expect(hasUnknownAdvisorProfile("/nl/keuzehulp")).toBe(false);
  });
});
