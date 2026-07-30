import { cookies } from "next/headers";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { APP_CONFIG } from "@/lib/config";

export async function createServerClient() {
  const cookieStore = await cookies();
  return createSsrServerClient(
    APP_CONFIG.supabaseUrl,
    APP_CONFIG.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}