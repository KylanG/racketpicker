"use server";

import { isValidEmail } from "@/lib/newsletter/email";
import { contactFormEnabled, CONTACT_SUBJECTS, type ContactSubject } from "./config";

export type ContactResult = { status: "sent" } | { status: "invalid" } | { status: "unavailable" };

const MAX = { name: 100, message: 5000 };

/**
 * Contact form (RP-36): sends the message to hello@racketpicker.com via the Resend API.
 * A filled honeypot field is treated as sent (bots get no signal), nothing is stored.
 */
export async function sendContactMessage(form: FormData): Promise<ContactResult> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();
  const subject = String(form.get("subject") ?? "other") as ContactSubject;
  if (String(form.get("website") ?? "")) return { status: "sent" };

  if (
    !name ||
    name.length > MAX.name ||
    !isValidEmail(email) ||
    !message ||
    message.length > MAX.message
  ) {
    return { status: "invalid" };
  }
  if (!contactFormEnabled()) return { status: "unavailable" };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM,
      to: [process.env.CONTACT_TO ?? "hello@racketpicker.com"],
      reply_to: email,
      subject: `[Contact] ${CONTACT_SUBJECTS.includes(subject) ? subject : "other"}: ${name}`,
      text: `${message}\n\n—\n${name} <${email}>`,
    }),
  }).catch(() => null);

  if (!response?.ok) {
    console.error("[contact] sending failed", response?.status);
    return { status: "unavailable" };
  }
  return { status: "sent" };
}
