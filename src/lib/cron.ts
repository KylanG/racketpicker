import { timingSafeEqual } from "node:crypto";

/**
 * Vercel Cron calls the route with `Authorization: Bearer <CRON_SECRET>`.
 * Without CRON_SECRET configured, cron routes are closed.
 */
export function isAuthorizedCronRequest(
  authorization: string | null,
  secret = process.env.CRON_SECRET,
): boolean {
  if (!secret || !authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authorization);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
