/**
 * Proxy — Route protection for authenticated routes.
 * Uses cookie-based session validation to protect dashboard routes.
 * Replaces deprecated middleware convention (Next.js 16+).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ─── Protected routes ────────────────────────────────────────────────────── */

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

/* ─── Public routes (skip auth check) ─────────────────────────────────────── */

const PUBLIC_EXCLUDES = [
  "/login",
  "/register",
  "/unauthorized",
];

/* ─── Matcher ─────────────────────────────────────────────────────────────── */

export const matcher = [
  "/((?!api|_next/static|_next/chunk|favicon.ico).*)",
];

/* ─── Proxy handler ───────────────────────────────────────────────────────── */

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

  /* ─── Read Supabase auth token from cookie ─────────────────────────────── */

  const cookieStore = request.cookies;

  // Try common Supabase cookie naming patterns
  const possibleCookieNames = [
    "sb-arovjfznstzgqandbahe.auth-token",
    "sb-arovjfznstzgqandbahe.auth.token",
    "sb-auth-token",
    "auth.token",
  ];

  let sessionToken: string | undefined;
  for (const name of possibleCookieNames) {
    sessionToken = cookieStore.get(name)?.value;
    if (sessionToken) break;
  }

  // No session token → redirect to login
  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  /* ─── Verify token payload ───────────────────────────────────────────────── */

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
