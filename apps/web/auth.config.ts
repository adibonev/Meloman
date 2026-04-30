import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as "player" | "admin" | "super_admin";
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
};
