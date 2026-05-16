import "server-only";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@meloman/db";
import { users } from "@meloman/db/schema";
import {
  passwordFingerprint,
  signResetToken,
  verifyResetToken,
} from "@/lib/api/password-reset-token";
import { sendPasswordResetEmail } from "@/lib/email";

/**
 * Shared password-reset logic, used by both the REST routes (CLAUDE.md
 * §7.1) and the web server actions so there's a single source of truth.
 */

/**
 * Self-service request. Always resolves the same way regardless of
 * whether the address exists — never reveal account existence (user
 * enumeration). The link is built from the request origin so it works in
 * dev and on Vercel.
 */
export async function requestPasswordReset(
  email: string,
  origin: string
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);

  if (!user) return; // silent — no enumeration

  const token = signResetToken(user.id, user.passwordHash);
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
  await sendPasswordResetEmail(normalized, resetUrl);
}

/**
 * Admin-triggered reset for a known user id. Same email/token path; the
 * caller (super-admin action) has already authorized it.
 */
export async function sendResetForUser(
  userId: string,
  origin: string
): Promise<{ ok: true } | { errorKey: "notFound" }> {
  const [user] = await db
    .select({
      email: users.email,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { errorKey: "notFound" };

  const token = signResetToken(userId, user.passwordHash);
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
  await sendPasswordResetEmail(user.email, resetUrl);
  return { ok: true };
}

/**
 * Consume a reset token and set the new password. The token's
 * fingerprint is re-checked against the live hash, so an already-used or
 * superseded link fails even though the token itself is stateless.
 */
export async function performPasswordReset(
  token: string,
  newPassword: string
): Promise<{ ok: true } | { errorKey: "invalidToken" }> {
  const payload = verifyResetToken(token);
  if (!payload) return { errorKey: "invalidToken" };

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);

  if (!user) return { errorKey: "invalidToken" };
  if (passwordFingerprint(user.passwordHash) !== payload.fp) {
    // Password already changed since the link was issued → stale link.
    return { errorKey: "invalidToken" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return { ok: true };
}
