import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@meloman/db";
import { gameSessions, users } from "@meloman/db/schema";
import { apiError } from "@/lib/api/guard";
import { signMobileToken } from "@/lib/api/mobile-token";

const schema = z.object({
  displayName: z.string().min(2).max(50),
  code: z.string().min(4).max(8),
});

/**
 * POST /api/auth/guest — anonymous quiz entry for the Expo client (app +
 * web export). Mirrors the web `joinAsAnonymousAction`: verify the join
 * code points at a session still in the lobby, mint a throwaway player
 * user (random email + password, never reusable), and return a bearer
 * token. Guests earn no XP/streak and don't compete for prizes — the UI
 * says so. Tying creation to a joinable session avoids orphan anon rows.
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
    return apiError("invalidData", "Name and join code are required.", 422);
  }

  const code = parsed.data.code.toUpperCase();
  const [row] = await db
    .select({ id: gameSessions.id, status: gameSessions.status })
    .from(gameSessions)
    .where(eq(gameSessions.joinCode, code))
    .limit(1);

  if (!row) {
    return apiError("sessionNotFound", "No quiz with this code.", 404);
  }
  if (row.status !== "lobby") {
    return apiError(
      "sessionNotJoinable",
      "This quiz is no longer accepting players.",
      409
    );
  }

  const email = `anon-${randomUUID()}@meloman.local`;
  const passwordHash = await bcrypt.hash(randomUUID(), 12);

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      displayName: parsed.data.displayName,
      role: "player",
      emailVerified: false,
    })
    .returning({ id: users.id, role: users.role });

  const token = signMobileToken(user.id, user.role);
  return NextResponse.json({
    token,
    user: {
      id: user.id,
      email,
      name: parsed.data.displayName,
      role: user.role,
    },
  });
}
