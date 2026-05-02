import createIntlMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Strip optional /en prefix to evaluate the logical route
  const localeStripped = pathname.replace(/^\/en(\/|$)/, "/") || "/";
  const isProtected =
    localeStripped.startsWith("/admin") || localeStripped.startsWith("/host");

  if (isProtected) {
    const localePrefix =
      pathname.startsWith("/en/") || pathname === "/en" ? "/en" : "";
    const role = req.auth?.user?.role;
    const isLoggedIn = !!req.auth?.user;

    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`${localePrefix}/login`, req.url));
    }

    if (role !== "admin" && role !== "super_admin") {
      return NextResponse.redirect(new URL(`${localePrefix}/`, req.url));
    }
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
