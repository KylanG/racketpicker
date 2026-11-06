import { createHash, randomBytes } from "node:crypto";

/** Random URL-safe token for a mail link, and the hash we store instead (RP-32). */
export function newToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString("base64url");
  return { token, hash: hashToken(token) };
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Tokens from links: base64url, 32 characters for 24 bytes. */
export const isTokenShape = (t: unknown): t is string =>
  typeof t === "string" && /^[A-Za-z0-9_-]{32}$/.test(t);
