/**
 * @module lib/supabase/client
 * Supabase client factory — single source of truth for client instantiation.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { APP_CONFIG } from "@/lib/config";

/**
 * Create a new Supabase client from environment configuration.
 *
 * @throws Error if URL or anon key is missing
 */
export function createSupabaseClient(): SupabaseClient {
  const url = APP_CONFIG.supabaseUrl;
  const key = APP_CONFIG.supabaseAnonKey;

  if (!url || !key) {
    throw new Error(
      "Supabase URL atau anon key tidak ditemukan. Cek NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createClient(url, key);
}
