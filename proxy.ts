/**
 * Proxy — Route protection for authenticated routes.
 * Uses cookie-based session validation to protect dashboard routes.
 * Replaces deprecated middleware convention (Next.js 16+).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes array
const PROTECTED_ROUTES = [
  "/dashboard",
  "/inventory",
  "/orders",
  "/manual-orders",
  "/upload",
  "/income",
  "/profit",
  "/supplier",
  "/status-tracker",
  "/settings",
];

// Public routes that don't require auth
const PUBLIC_EXCLUDES = [
  "/login",
  "/register",
  "/unauthorized",
];

// Match all routes except static assets
export const matcher = [
  "/((?!api|_next/static|_next/chunk|favicon.ico).*)",
];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if this is a public route
  if (PUBLIC_EXCLUDES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (!isProtected) {
    return NextResponse.next();
  }

  // Read Supabase auth session token from cookie
  const cookieStore = request.cookies;
  const sessionToken = cookieStore.get("auth.token")?.value;

  if (!sessionToken) {
    // No session cookie → redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify token signature and decode (simple payload check only, no signature verification)
  // This is a basic check - for production you should verify token properly
  try {
    const base64Url = sessionToken.split(".")[1];
    if (!base64Url) throw new Error("Invalid token");

    const decoded = JSON.parse(
      atob(base64Url.replace(/-/g, "+").replace(/_/g, "/"))
    );

    // Check expiration
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch (err) {
    // Invalid token → redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
