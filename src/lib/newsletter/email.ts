/** Max length of an address (RFC 5321). */
const MAX_LENGTH = 254;

/**
 * Pragmatic check: one @, something before it, a dotted domain after it, no spaces.
 * The double opt-in mail (RP-32) is the real proof that an address works.
 */
export function isValidEmail(value: string): boolean {
  const email = value.trim();
  if (email.length === 0 || email.length > MAX_LENGTH) return false;
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email);
}
