import { NextResponse } from "next/server";
import { getPathname } from "@/i18n/navigation";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";
import { confirmSubscription } from "@/lib/newsletter/subscribe";

const localeOf = (v: string | null): Locale =>
  (routing.locales as readonly string[]).includes(v ?? "") ? (v as Locale) : defaultLocale;

/** Confirmation link in the double opt-in mail (RP-32): confirm, then show the result page. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = localeOf(url.searchParams.get("locale"));
  const result = await confirmSubscription(url.searchParams.get("token"));
  const status = result === "confirmed" ? "bevestigd" : "ongeldig";
  const target = getPathname({
    locale,
    href: { pathname: "/newsletter/[status]", params: { status } },
  });
  const res = NextResponse.redirect(new URL(target, url), 303);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}
