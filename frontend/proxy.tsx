import { NextRequest, NextResponse } from "next/server";

const TOKEN_COOKIE = "dezenmart_logistics_token";

const PUBLIC_ROUTES = [
  "/login",
  "/sign_up",
  "/forget_password",
  "/verify_code",
  "/set_password",
  "/google/callback",
  "/auth/logistics/google",
  "/onboarding",
];

const PROTECTED_ROUTES = [
  "/dashboard",
  "/orderpage",
  "/profile",
  "/pricing",
  "/admin",
  "/chats",
  "/wallet",
  "/riders",
  "/earnings",
  "/deliveries",
  "/ratings",
  "/settings",
  "/notifications",
  "/support",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(TOKEN_COOKIE)?.value;

  // Always allow these — they handle their own auth client-side
  if (
    pathname.startsWith("/google/callback") ||
    pathname.startsWith("/auth/logistics/google") ||
    pathname.startsWith("/onboarding")
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtected && !token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (isPublic && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
