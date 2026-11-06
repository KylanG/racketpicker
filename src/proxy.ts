import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { hasUnknownAdvisorProfile } from "./lib/advisor/route-guard";
import { hasUnknownNewsletterStatus } from "./lib/newsletter/status";
import { articleExists, articleFromPath } from "./lib/blog/route-guard";
import { hasUnknownSport, racketExists, racketFromPath } from "./lib/catalog/route-guard";

const intl = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const article = articleFromPath(pathname);
  const racket = racketFromPath(pathname);
  // Unknown sport (e.g. /nl/rackets/voetbal), advisor profile, article, racket or accessory: rewrite to a path no route
  // matches, so the global 404 page is served with status 404 instead of a streamed 200.
  if (
    hasUnknownSport(pathname) ||
    hasUnknownAdvisorProfile(pathname) ||
    hasUnknownNewsletterStatus(pathname) ||
    (article && !(await articleExists(article.locale, article.slug))) ||
    (racket && !(await racketExists(racket)))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${request.nextUrl.pathname.split("/")[1]}/_not-found`;
    return NextResponse.rewrite(url);
  }
  return intl(request);
}

export const config = {
  // Everything except API routes, /go/ redirects (RP-52), Next internals and files with an extension.
  matcher: "/((?!api|go/|_next|_vercel|.*\\..*).*)",
};
