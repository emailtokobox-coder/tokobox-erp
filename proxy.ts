import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const PROTECTED_ROUTES = ["/dashboard", "/inventory", "/orders", "/manual-orders", "/upload", "/income", "/profit", "/supplier", "/status-tracker", "/settings"];
const PUBLIC_EXCLUDES = ["/login", "/register", "/unauthorized"];

export const matcher = ["/((?!api|_next/static|_next/chunk|favicon.ico).*)"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (PUBLIC_EXCLUDES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (!isProtected) {
    return NextResponse.next();
  }

  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
