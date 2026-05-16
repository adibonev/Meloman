import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless HS256 password-reset token. Same dependency-free approach as
 * `mobile-token.ts` (Node crypto, signed with AUTH_SECRET) so no new DB
 * table is needed (CLAUDE.md §17).
 *
 * The payload carries a `fp` fingerprint derived from the user's current
 * password hash. Verification (in the service) re-derives it from the
 * live row, so a token stops working the moment the password changes —
 * making it effectively single-use and invalidating any other
 * outstanding links once one reset succeeds, without server-side state.
 */

type ResetTokenPayload = {
  sub: string; // user id
  fp: string; // password-hash fingerprint
  exp: number; // unix seconds
};

const TTL_SECONDS = 60 * 15; // 15 minutes — short, it's a sensitive link.

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlJson(obj: unknown): string {
  return b64url(JSON.stringify(obj));
}

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

/** Short, non-reversible tag of the current password hash. */
export function passwordFingerprint(passwordHash: string): string {
  return createHmac("sha256", secret())
    .update(passwordHash)
    .digest("hex")
    .slice(0, 16);
}

export function signResetToken(sub: string, passwordHash: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const payload: ResetTokenPayload = {
    sub,
    fp: passwordFingerprint(passwordHash),
    exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
  };
  const signingInput = `${b64urlJson(header)}.${b64urlJson(payload)}`;
  const sig = b64url(
    createHmac("sha256", secret()).update(signingInput).digest()
  );
  return `${signingInput}.${sig}`;
}

export function verifyResetToken(
  token: string
): ResetTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const expected = b64url(
    createHmac("sha256", secret()).update(`${h}.${p}`).digest()
  );
  const a = Buffer.from(s);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(p, "base64").toString("utf8")
    ) as ResetTokenPayload;
    if (
      typeof payload.sub !== "string" ||
      typeof payload.fp !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
