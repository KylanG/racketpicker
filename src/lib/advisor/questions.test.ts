import { describe, expect, it } from "vitest";
import {
  activeSteps,
  currentStep,
  isComplete,
  parseAnswers,
  parseProfile,
  profileSlug,
  quizQuery,
  stepOptions,
} from "./questions";

describe("advisor questions", () => {
  it("only offers sports with rackets, in taxonomy order", () => {
    expect(stepOptions("sport", ["tennis", "padel"])).toEqual(["padel", "tennis"]);
  });

  it("skips the sport question with only one sport", () => {
    expect(activeSteps(["padel"])).toEqual(["niveau", "stijl", "frequentie", "budget"]);
    expect(activeSteps(["padel", "tennis"])).toHaveLength(5);
    expect(parseAnswers({}, ["padel"])).toEqual({ sport: "padel" });
  });

  it("drops unknown values from the URL", () => {
    expect(
      parseAnswers({ sport: "squash", niveau: "pro", stijl: "power", budget: ["75-150"] }, [
        "padel",
        "tennis",
      ]),
    ).toEqual({ stijl: "power", budget: "75-150" });
  });

  it("shows the first open question, or the asked step up to that", () => {
    const steps = activeSteps(["padel"]);
    const a = parseAnswers({ niveau: "beginner", stijl: "controle" }, ["padel"]);
    expect(currentStep({}, a, steps)).toBe(2);
    expect(currentStep({ stap: "1" }, a, steps)).toBe(0);
    expect(currentStep({ stap: "4" }, a, steps)).toBe(2);
    expect(currentStep({ stap: "x" }, a, steps)).toBe(2);
  });

  it("round-trips the quiz query and the profile slug", () => {
    const steps = activeSteps(["padel"]);
    const a = parseAnswers(
      { niveau: "competitie", stijl: "allround", frequentie: "vaak", budget: "250-plus" },
      ["padel"],
    );
    expect(isComplete(a)).toBe(true);
    expect(quizQuery(a, steps, 1)).toEqual({
      niveau: "competitie",
      stijl: "allround",
      frequentie: "vaak",
      budget: "250-plus",
      stap: "2",
    });
    expect(profileSlug({ niveau: "competitie", stijl: "allround" })).toBe("competitie-allround");
    expect(parseProfile("competitie-allround")).toEqual({
      niveau: "competitie",
      stijl: "allround",
    });
    expect(parseProfile("pro-allround")).toBeNull();
  });
});
