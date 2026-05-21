import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@meloman/db";
import { users } from "@meloman/db/schema";
import { apiError } from "@/lib/api/guard";
import { signMobileToken } from "@/lib/api/mobile-token";
import { getRequestOrigin } from "@/lib/origin";
import {
  isVerificationEnforced,
  sendVerificationFor,
} from "@/lib/auth/email-verification";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(50),
});

/**
 * POST /api/auth/register — create a player account (CLAUDE.md §7.1),
 * used by the Expo app. When email verification isn't enforced the
 * account is usable immediately and we return a bearer token so the app
 * signs the user straight in; when enforced we send the link and return
 * `{ pending: true }` instead.
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
    return apiError("invalidData", "Invalid registration data.", 422);
  }
  const email = parsed.data.email.trim().toLowerCase();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return apiError("emailTaken", "This email is already registered.", 409);
  }

  const enforced = isVerificationEnforced();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const [created] = await db
    .insert(users)
    .values({
      email,
      displayName: parsed.data.displayName,
      passwordHash,
      role: "player",
      emailVerified: !enforced,
    })
    .returning({ id: users.id, role: users.role });

  if (enforced) {
    await sendVerificationFor(email, await getRequestOrigin());
    return NextResponse.json({ pending: true });
  }

  const token = signMobileToken(created.id, created.role);
  return NextResponse.json(
    {
      token,
      user: {
        id: created.id,
        email,
        name: parsed.data.displayName,
        role: created.role,
      },
    },
    { status: 201 }
  );
}
