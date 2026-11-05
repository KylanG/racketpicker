import { after, NextResponse, type NextRequest } from "next/server";
import { defaultLocale } from "@/i18n/routing";
import { isBot, safeTarget, sourcePath, validGoParams } from "@/lib/go/redirect";
import { createPublicClient } from "@/lib/supabase/public";

const HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

/**
 * /go/[shop]/[offer]: looks up the affiliate link of an active offer, redirects (302) and
 * logs the click after the response is sent. No IP, user agent or cookies are stored.
 * Unknown or inactive offers go back to the page the visitor came from.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shop: string; offer: string }> },
) {
  const { shop, offer } = await params;
  const referer = request.headers.get("referer");
  const from = sourcePath(referer, request.nextUrl.origin);
  const fallback = new URL(from ?? `/${defaultLocale}`, request.nextUrl.origin);

  if (!validGoParams(shop, offer)) {
    return NextResponse.redirect(fallback, { status: 302, headers: HEADERS });
  }

  const supabase = createPublicClient();
  // RLS only returns active offers of published products at active shops.
  const { data, error } = await supabase
    .from("offers")
    .select("affiliate_url, shops!inner(slug)")
    .eq("id", offer)
    .eq("shops.slug", shop)
    .maybeSingle();
  if (error) console.error("[go] offer lookup failed", error.message);

  const target = safeTarget(data?.affiliate_url ?? null);
  if (!target) return NextResponse.redirect(fallback, { status: 302, headers: HEADERS });

  if (!isBot(request.headers.get("user-agent"))) {
    after(async () => {
      const { error: logError } = await supabase.rpc("record_click", {
        p_offer_id: offer,
        p_source_path: from ?? undefined,
      });
      if (logError) console.error("[go] click not recorded", logError.message);
    });
  }

  return NextResponse.redirect(target, { status: 302, headers: HEADERS });
}
