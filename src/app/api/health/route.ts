import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

// Health check for uptime monitoring and deploy verification: confirms the database is reachable.
export async function GET() {
  const { data, error } = await createPublicClient()
    .from("markets")
    .select("code")
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ ok: false, database: "unreachable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, database: "ok", activeMarkets: data.map((m) => m.code) });
}
