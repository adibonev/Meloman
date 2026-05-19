import { db } from "@meloman/db";
import { users } from "@meloman/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

/**
 * OAuth providers are registered only when their credentials are present
 * in the environment, so the buttons stay inert (and don't 500) until
 * real keys are added — Google/Facebook ship dark, flip on with env.
 * See `oauthProviders()` for the UI gate.
 */
const oauthProviders: NextAuthConfig["providers"] = [];
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  oauthProviders.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}
if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
  oauthProviders.push(
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    })
  );
}

/** Which OAuth buttons the auth pages should render (env-gated). */
export function configuredOauthProviders(): ("google" | "facebook")[] {
  const list: ("google" | "facebook")[] = [];
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)
    list.push("google");
  if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET)
    list.push("facebook");
  return list;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: user.role,
        };
      },
    }),
    ...oauthProviders,
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * OAuth sign-in: upsert a local users row so the rest of the app
     * (roles, FKs, profile) keeps working uniformly. Credentials users
     * already exist; nothing to do for them.
     */
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") return true;
      const email = user.email?.trim().toLowerCase();
      if (!email) return false;

      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!existing) {
        // Random unusable password — OAuth users never sign in with one.
        const passwordHash = await bcrypt.hash(randomUUID(), 12);
        await db.insert(users).values({
          email,
          displayName: user.name ?? email.split("@")[0],
          passwordHash,
          role: "player",
          emailVerified: true, // provider already verified the address
        });
      }
      return true;
    },
    /**
     * Resolve the canonical local user (id + role) by email so OAuth
     * tokens carry our DB id, not the provider id. Credentials keep the
     * id/role the authorize callback returned.
     */
    async jwt({ token, user, account }) {
      if (user && account && account.provider !== "credentials") {
        const email = user.email?.trim().toLowerCase();
        if (email) {
          const [dbUser] = await db
            .select({ id: users.id, role: users.role })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
          if (dbUser) {
            token.sub = dbUser.id;
            token.role = dbUser.role;
          }
        }
        return token;
      }
      // Credentials / token refresh: same behaviour as auth.config.
      if (user) token.role = (user as { role?: string }).role;
      return token;
    },
  },
});
