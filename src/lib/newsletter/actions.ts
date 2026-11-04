"use server";

import { isValidEmail } from "./email";

export type SubscribeResult =
  { status: "success" } | { status: "invalid" } | { status: "unavailable" };

/**
 * Newsletter sign-up from the footer. Storing the address and sending the double opt-in
 * mail via Resend follow in RP-32; until then the form honestly reports that signing
 * up is not possible yet, instead of pretending it worked.
 */
export async function subscribeToNewsletter(email: string): Promise<SubscribeResult> {
  if (typeof email !== "string" || !isValidEmail(email)) return { status: "invalid" };
  return { status: "unavailable" };
}
