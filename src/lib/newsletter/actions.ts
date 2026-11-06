"use server";

import { getLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { isValidEmail } from "./email";
import { subscribe } from "./subscribe";

export type SubscribeResult =
  { status: "success" } | { status: "invalid" } | { status: "unavailable" };

/**
 * Newsletter sign-up from the footer (RP-32): double opt-in via a confirmation mail.
 * "success" also for addresses that are already subscribed, so the form does not
 * reveal who is on the list.
 */
export async function subscribeToNewsletter(email: string): Promise<SubscribeResult> {
  if (typeof email !== "string" || !isValidEmail(email)) return { status: "invalid" };
  const outcome = await subscribe(email, (await getLocale()) as Locale);
  return outcome === "unavailable" ? { status: "unavailable" } : { status: "success" };
}
