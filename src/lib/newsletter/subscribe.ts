import "server-only";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { mailLayout } from "@/lib/mail/layout";
import { mailConfigured, sendMail } from "@/lib/mail/send";
import { hashToken, isTokenShape, newToken } from "@/lib/mail/tokens";
import { createAdminClient } from "@/lib/supabase/admin";

/** No second confirmation mail within this time (double submits, abuse). */
const RESEND_AFTER_MS = 10 * 60_000;
/** Confirmation links stop working after a week. */
const CONFIRM_VALID_MS = 7 * 24 * 60 * 60_000;

export const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? "https://racketpicker.com").replace(/\/$/, "");

export type SubscribeOutcome = "sent" | "already" | "unavailable";

/**
 * Double opt-in sign-up (RP-32): stores the address as pending and mails a confirmation
 * link. An already confirmed address gets no mail; the form shows the same message, so
 * the form does not reveal who is subscribed.
 */
export async function subscribe(rawEmail: string, locale: Locale): Promise<SubscribeOutcome> {
  if (!mailConfigured()) return "unavailable";
  const email = rawEmail.trim().toLowerCase();
  const db = createAdminClient();
  const { data: existing, error } = await db
    .from("subscribers")
    .select("id, status, confirm_sent_at, unsubscribe_token_hash")
    .eq("email", email)
    .eq("market_code", locale)
    .maybeSingle();
  if (error) {
    console.error("[newsletter] lookup failed:", error.message);
    return "unavailable";
  }
  if (existing?.status === "confirmed") return "already";
  if (
    existing?.status === "pending" &&
    existing.confirm_sent_at &&
    Date.now() - Date.parse(existing.confirm_sent_at) < RESEND_AFTER_MS
  ) {
    return "sent";
  }

  const confirm = newToken();
  const unsubscribe = newToken();
  const now = new Date().toISOString();
  const { error: writeError } = await db.from("subscribers").upsert(
    {
      email,
      market_code: locale,
      status: "pending",
      confirm_token_hash: confirm.hash,
      unsubscribe_token_hash: unsubscribe.hash,
      confirm_sent_at: now,
      unsubscribed_at: null,
      updated_at: now,
    },
    { onConflict: "email,market_code" },
  );
  if (writeError) {
    console.error("[newsletter] storing failed:", writeError.message);
    return "unavailable";
  }

  const t = await getTranslations({ locale, namespace: "newsletter.mail" });
  const base = `${siteUrl()}/api/newsletter`;
  const confirmUrl = `${base}/confirm?token=${confirm.token}&locale=${locale}`;
  const unsubscribeUrl = `${base}/unsubscribe?token=${unsubscribe.token}&locale=${locale}`;
  const result = await sendMail({
    to: email,
    subject: t("subject"),
    html: mailLayout({
      title: t("title"),
      paragraphs: [t("intro"), t("ignore")],
      button: { label: t("button"), href: confirmUrl },
      footer: [t("why"), `${t("unsubscribe")} ${unsubscribeUrl}`],
    }),
    text: [
      t("title"),
      "",
      t("intro"),
      "",
      `${t("button")}: ${confirmUrl}`,
      "",
      t("ignore"),
      "",
      t("why"),
    ].join("\n"),
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
  return result.ok ? "sent" : "unavailable";
}

/** Confirms the address behind a confirmation link; "invalid" for unknown or expired links. */
export async function confirmSubscription(token: unknown): Promise<"confirmed" | "invalid"> {
  if (!isTokenShape(token)) return "invalid";
  const db = createAdminClient();
  const { data } = await db
    .from("subscribers")
    .select("id, confirm_sent_at")
    .eq("confirm_token_hash", hashToken(token))
    .maybeSingle();
  if (!data?.confirm_sent_at || Date.now() - Date.parse(data.confirm_sent_at) > CONFIRM_VALID_MS) {
    return "invalid";
  }
  const now = new Date().toISOString();
  const { error } = await db
    .from("subscribers")
    .update({ status: "confirmed", confirmed_at: now, confirm_token_hash: null, updated_at: now })
    .eq("id", data.id);
  return error ? "invalid" : "confirmed";
}

/** Unsubscribes via the link in every mail; repeated clicks keep working. */
export async function unsubscribe(token: unknown): Promise<"unsubscribed" | "invalid"> {
  if (!isTokenShape(token)) return "invalid";
  const now = new Date().toISOString();
  const { data, error } = await createAdminClient()
    .from("subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: now,
      confirm_token_hash: null,
      updated_at: now,
    })
    .eq("unsubscribe_token_hash", hashToken(token))
    .select("id");
  return !error && data.length > 0 ? "unsubscribed" : "invalid";
}
