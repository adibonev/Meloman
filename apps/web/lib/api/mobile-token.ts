import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal HS256 JWT for the mobile app. We don't reuse the Auth.js session
 * cookie because React Native has no cookie jar; mobile sends
 * `Authorization: Bearer <token>` instead. Signed with AUTH_SECRET so it
 * shares the server's trust root. Kept dependency-free (Node crypto) on
 * purpose — no new package for the deadline.
 */

type MobileTokenPayload = {
  sub: string; // user id
  role: "player" | "admin" | "super_admin";
  exp: number; // unix seconds
};

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

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function signMobileToken(
  sub: string,
  role: MobileTokenPayload["role"]
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const payload: MobileTokenPayload = {
    sub,
    role,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const signingInput = `${b64urlJson(header)}.${b64urlJson(payload)}`;
  const sig = b64url(
    createHmac("sha256", secret()).update(signingInput).digest()
  );
  return `${signingInput}.${sig}`;
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
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
    ) as MobileTokenPayload;
    if (
      typeof payload.sub !== "string" ||
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
