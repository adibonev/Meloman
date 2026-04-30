import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/admin")) {
    if (role !== "admin" && role !== "super_admin") {
      return Response.redirect(new URL("/login", req.url));
    }
  }

  if (pathname.startsWith("/host")) {
    if (role !== "admin" && role !== "super_admin") {
      return Response.redirect(new URL("/login", req.url));
    }
  }
});

export const config = {
  matcher: ["/admin/:path*", "/host/:path*"],
};
