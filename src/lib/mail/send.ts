import "server-only";

/**
 * Transactional mail via the Resend REST API (RP-32). Needs RESEND_API_KEY (Sensitive,
 * Production) and a verified sending domain; MAIL_FROM overrides the sender.
 * Without a key nothing is sent and the caller reports that honestly.
 */
export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

export type SendResult =
  { ok: true; id: string } | { ok: false; reason: "not_configured" | "failed" };

const DEFAULT_FROM = "Racketpicker <hallo@racketpicker.com>";

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendMail(mail: Mail, fetcher: typeof fetch = fetch): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: "not_configured" };
  try {
    const res = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || DEFAULT_FROM,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        headers: mail.headers,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(
        `[mail] Resend answered HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`,
      );
      return { ok: false, reason: "failed" };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id ?? "" };
  } catch (error) {
    console.error("[mail] sending failed:", error instanceof Error ? error.message : error);
    return { ok: false, reason: "failed" };
  }
}
