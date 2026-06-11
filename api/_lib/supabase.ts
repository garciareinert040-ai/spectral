import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "./config";

let client: SupabaseClient | null = null;

/** Service-role client (server-side only). Returns null when Supabase isn't configured. */
export function getSupabase(): SupabaseClient | null {
  if (!config.supabaseConfigured) return null;
  if (!client) {
    client = createClient(config.supabaseUrl!, config.supabaseServiceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
