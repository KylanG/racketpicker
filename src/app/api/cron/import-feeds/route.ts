import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CATALOG_TAG } from "@/lib/catalog/cache-tags";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { runDailyImport } from "@/lib/feeds/run-all";

// Several feeds plus photo copies can take a while; Vercel Pro allows this.
export const maxDuration = 300;

/** Daily feed import, triggered by Vercel Cron (see vercel.json). */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDailyImport();
    // New prices/stock: mark catalog pages stale; they refresh on their next visit.
    if (result.changed) revalidateTag(CATALOG_TAG, "max");

    const failed = result.shops.filter((s) => !s.ok).length;
    const stored = "stored" in result.images ? result.images.stored : 0;
    console.log(
      `[feeds] daily import: ${result.shops.length} shops (${failed} failed), ${stored} photos stored`,
    );
    // Non-2xx makes the run show as failed in the Vercel Cron overview.
    return NextResponse.json({ ok: failed === 0, ...result }, { status: failed ? 500 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[feeds] daily import failed: ${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
