import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless HS256 email-verification token. Same dependency-free,
 * no-DB-table approach as the password-reset token (CLAUDE.md §17),
 * signed with AUTH_SECRET.
 *
 * The payload carries an `fp` fingerprint of the user's current
 * verified state. Confirmation re-derives it from the live row, so once
 * the address is verified any outstanding link stops working — making
 * the token effectively single-use without server-side state.
 */

type VerifyTokenPayload = {
  sub: string; // user id
  fp: string; // verified-state fingerprint
  exp: number; // unix seconds
};

const TTL_SECONDS = 60 * 60 * 24; // 24h — sign-up confirmation link.

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

/** Short, non-reversible tag of the current verified state. */
export function verifyFingerprint(
  userId: string,
  emailVerified: boolean
): string {
  return createHmac("sha256", secret())
    .update(`${userId}:${emailVerified ? "1" : "0"}`)
    .digest("hex")
    .slice(0, 16);
}

export function signVerifyToken(
  sub: string,
  emailVerified: boolean
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const payload: VerifyTokenPayload = {
    sub,
    fp: verifyFingerprint(sub, emailVerified),
    exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
  };
  const signingInput = `${b64urlJson(header)}.${b64urlJson(payload)}`;
  const sig = b64url(
    createHmac("sha256", secret()).update(signingInput).digest()
  );
  return `${signingInput}.${sig}`;
}

export function verifyVerifyToken(
  token: string
): VerifyTokenPayload | null {
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
    ) as VerifyTokenPayload;
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
