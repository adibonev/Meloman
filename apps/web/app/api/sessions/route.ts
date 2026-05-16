import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@meloman/db";
import { gameSessions, quizzes } from "@meloman/db/schema";
import { apiError, requireAdmin } from "@/lib/api/guard";
import { generateJoinCode } from "@/lib/join-code";

const createSessionSchema = z.object({
  quizId: z.string().uuid("quizIdInvalid"),
});

/**
 * POST /api/sessions — host creates a live session for a quiz (admin).
 *
 * Returns the join code players type/scan. State transitions afterwards are
 * driven by the host Server Actions (Pusher-backed); this only opens the
 * lobby. Join-code uniqueness mirrors the admin Server Action.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalidJson", "Request body must be valid JSON.", 400);
  }

  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("invalidData", "quizId is required.", 422);
  }

  const [quiz] = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .where(
      and(eq(quizzes.id, parsed.data.quizId), isNull(quizzes.deletedAt))
    )
    .limit(1);
  if (!quiz) {
    return apiError("notFound", "Quiz not found.", 404);
  }

  let joinCode: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateJoinCode();
    const [clash] = await db
      .select({ id: gameSessions.id })
      .from(gameSessions)
      .where(eq(gameSessions.joinCode, candidate))
      .limit(1);
    if (!clash) {
      joinCode = candidate;
      break;
    }
  }
  if (!joinCode) {
    return apiError(
      "joinCodeCollision",
      "Could not allocate a unique join code.",
      503
    );
  }

  const [created] = await db
    .insert(gameSessions)
    .values({
      quizId: quiz.id,
      hostId: guard.session.user.id,
      joinCode,
      status: "lobby",
    })
    .returning({ id: gameSessions.id, joinCode: gameSessions.joinCode });

  return NextResponse.json({ session: created }, { status: 201 });
}
