import { describe, expect, it } from "vitest";
import { isValidEmail } from "../email";

describe("isValidEmail", () => {
  it.each(["naam@voorbeeld.nl", " jan.de-vries+padel@mail.co.uk ", "a@b.io"])("accepts %s", (v) =>
    expect(isValidEmail(v)).toBe(true),
  );

  it.each([
    "",
    "naam",
    "naam@",
    "@voorbeeld.nl",
    "naam@voorbeeld",
    "na am@voorbeeld.nl",
    "a@b..nl",
  ])("rejects %j", (v) => expect(isValidEmail(v)).toBe(false));

  it("rejects addresses longer than 254 characters", () =>
    expect(isValidEmail(`${"a".repeat(250)}@b.nl`)).toBe(false));
});
