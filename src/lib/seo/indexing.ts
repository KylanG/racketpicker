/**
 * Whether search engines may index the site (RP-34). Off until launch: set
 * SITE_INDEXABLE=true in Vercel (Production) to switch it on. Preview deployments and
 * local builds are never indexable, whatever the variable says.
 */
export function siteIndexable(): boolean {
  return process.env.SITE_INDEXABLE === "true" && process.env.VERCEL_ENV === "production";
}

/** Public base URL without a trailing slash. */
export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://racketpicker.com").replace(/\/$/, "");
}
