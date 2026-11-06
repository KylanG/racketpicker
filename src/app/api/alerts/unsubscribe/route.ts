import { NextResponse } from "next/server";
import { getPathname } from "@/i18n/navigation";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";
import { unsubscribeAlert } from "@/lib/alerts/alerts";

const localeOf = (v: string | null): Locale =>
  (routing.locales as readonly string[]).includes(v ?? "") ? (v as Locale) : defaultLocale;

async function handle(request: Request, redirect: boolean) {
  const url = new URL(request.url);
  const result = await unsubscribeAlert(url.searchParams.get("token"));
  if (!redirect) return new NextResponse(null, { status: result === "unsubscribed" ? 200 : 400 });
  const locale = localeOf(url.searchParams.get("locale"));
  const status = result === "unsubscribed" ? "afgemeld" : "ongeldig";
  const target = getPathname({
    locale,
    href: { pathname: "/alerts/[status]", params: { status } },
  });
  const res = NextResponse.redirect(new URL(target, url), 303);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}

/** Turn-off link in every alert mail (RP-33). */
export const GET = (request: Request) => handle(request, true);
/** One-click unsubscribe from the mail client (List-Unsubscribe-Post, RFC 8058). */
export const POST = (request: Request) => handle(request, false);
