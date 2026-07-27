/**
 * Proxy — Placeholder for route protection.
 * Replaces deprecated middleware convention (Next.js 16+).
 * Auth handling is actually done via:
 *   - SessionProvider (client-side session management)
 *   - Dashboard layout (server-side getSessionAction check)
 * This proxy does not perform actual auth checks to avoid conflicts
 * with Supabase auth system.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * All routes except static assets and API.
 * This proxy currently passes through all requests without redirecting.
 * Authentication is handled by SessionProvider and layout components.
 */
export const matcher = [
  "/((?!api|_next/static|_next/chunk|favicon.ico).*)",
];

export async function proxy(_request: NextRequest) {
  // No auth checking here — let SessionProvider and dashboard layout handle it
  // Refer to: SessionProvider (src/components/providers/SessionProvider.tsx)
  //          and Dashboard layout (app/dashboard/layout.tsx)
  return NextResponse.next();
}
