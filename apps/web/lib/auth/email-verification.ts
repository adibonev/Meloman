import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@meloman/db";
import { users } from "@meloman/db/schema";
import {
  signVerifyToken,
  verifyFingerprint,
  verifyVerifyToken,
} from "@/lib/api/email-verify-token";
import { sendVerificationEmail } from "@/lib/email";

/**
 * Shared email-verification logic, used by the register/resend server
 * actions and the verify-email route so there's a single source of
 * truth (mirrors lib/auth/password-reset).
 */

/**
 * Send (or resend) a verification link. Silent when the address is
 * unknown or already verified — never reveal account existence.
 */
export async function sendVerificationFor(
  email: string,
  origin: string
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const [user] = await db
    .select({ id: users.id, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);

  if (!user || user.emailVerified) return; // silent — no enumeration

  const token = signVerifyToken(user.id, user.emailVerified);
  const verifyUrl = `${origin}/verify-email?token=${encodeURIComponent(token)}`;
  await sendVerificationEmail(normalized, verifyUrl);
}

/**
 * Consume a verification token and flip emailVerified. The fingerprint
 * is re-checked against the live row, so a link that's already been
 * used (state changed) fails even though the token is stateless.
 */
export async function confirmEmail(
  token: string
): Promise<{ ok: true } | { errorKey: "invalidToken" }> {
  const payload = verifyVerifyToken(token);
  if (!payload) return { errorKey: "invalidToken" };

  const [user] = await db
    .select({ id: users.id, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);

  if (!user) return { errorKey: "invalidToken" };
  if (verifyFingerprint(user.id, user.emailVerified) !== payload.fp) {
    // Already verified since the link was issued → stale link.
    return { errorKey: "invalidToken" };
  }

  await db
    .update(users)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return { ok: true };
}

/**
 * True when the address belongs to a real, not-yet-verified account.
 * Anonymous quiz players (anon-*@meloman.local) are never gated — the
 * guest-friendly entry stays open.
 */
export async function isUnverified(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (normalized.endsWith("@meloman.local")) return false;
  const [user] = await db
    .select({ emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);
  return !!user && !user.emailVerified;
}
