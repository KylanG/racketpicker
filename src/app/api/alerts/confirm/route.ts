import { NextResponse } from "next/server";
import { getPathname } from "@/i18n/navigation";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";
import { confirmAlert } from "@/lib/alerts/alerts";

const localeOf = (v: string | null): Locale =>
  (routing.locales as readonly string[]).includes(v ?? "") ? (v as Locale) : defaultLocale;

/** Confirmation link in the alert's double opt-in mail (RP-33): confirm, then show the result page. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = localeOf(url.searchParams.get("locale"));
  const result = await confirmAlert(url.searchParams.get("token"));
  const status = result === "confirmed" ? "bevestigd" : "ongeldig";
  const target = getPathname({
    locale,
    href: { pathname: "/alerts/[status]", params: { status } },
  });
  const res = NextResponse.redirect(new URL(target, url), 303);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}
