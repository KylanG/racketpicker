export const CONTACT_SUBJECTS = ["product", "price", "shop", "other"] as const;
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

/**
 * The form is only shown when e-mail can actually be sent (Resend key and a verified
 * sender, RP-31). Until then the contact page offers the e-mail address only.
 */
export function contactFormEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_FROM);
}
