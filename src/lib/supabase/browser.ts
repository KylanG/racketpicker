import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabasePublishableKey, supabaseUrl } from "./env";

/** Client for Client Components (e.g. price alerts, newsletter forms). Respects RLS. */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabasePublishableKey());
}
