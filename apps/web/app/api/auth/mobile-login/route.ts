import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@meloman/db";
import { users } from "@meloman/db/schema";
import { apiError } from "@/lib/api/guard";
import { signMobileToken } from "@/lib/api/mobile-token";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/auth/mobile-login — email/password → bearer JWT for the Expo
 * app. Mirrors the Auth.js Credentials provider (same bcrypt + users
 * table) but returns a token instead of setting a cookie.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalidJson", "Request body must be valid JSON.", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError("invalidData", "Email and password are required.", 422);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (!user) {
    return apiError("invalidCredentials", "Wrong email or password.", 401);
  }
  if (user.bannedAt) {
    return apiError("banned", "This account is banned.", 403);
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return apiError("invalidCredentials", "Wrong email or password.", 401);
  }

  const token = signMobileToken(user.id, user.role);
  return NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.displayName,
      role: user.role,
    },
  });
}
