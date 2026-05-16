import { NextResponse } from "next/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@meloman/db";
import { quizzes, rounds } from "@meloman/db/schema";
import { apiError, requireAdmin } from "@/lib/api/guard";
import { updateQuizSchema } from "@/lib/schemas/quiz";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/quizzes/[id] — quiz detail + its rounds (admin).
 * PATCH /api/quizzes/[id] — update core fields + status (admin).
 * DELETE /api/quizzes/[id] — soft delete (sets deleted_at) (admin).
 */
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.id, id), isNull(quizzes.deletedAt)))
    .limit(1);

  if (!quiz) {
    return apiError("notFound", "Quiz not found.", 404);
  }

  const quizRounds = await db
    .select({
      id: rounds.id,
      title: rounds.title,
      orderIndex: rounds.orderIndex,
      roundType: rounds.roundType,
    })
    .from(rounds)
    .where(eq(rounds.quizId, id))
    .orderBy(asc(rounds.orderIndex));

  return NextResponse.json({ quiz, rounds: quizRounds });
}

export async function PATCH(request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalidJson", "Request body must be valid JSON.", 400);
  }

  const parsed = updateQuizSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("invalidData", "Quiz payload failed validation.", 422);
  }

  const [updated] = await db
    .update(quizzes)
    .set({
      title: parsed.data.title,
      description: parsed.data.description,
      theme: parsed.data.theme,
      language: parsed.data.language,
      status: parsed.data.status,
      maxTeamSize:
        parsed.data.maxTeamSize === 0 ? null : parsed.data.maxTeamSize,
    })
    .where(and(eq(quizzes.id, id), isNull(quizzes.deletedAt)))
    .returning({ id: quizzes.id });

  if (!updated) {
    return apiError("notFound", "Quiz not found.", 404);
  }

  return NextResponse.json({ quiz: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const [deleted] = await db
    .update(quizzes)
    .set({ deletedAt: new Date() })
    .where(and(eq(quizzes.id, id), isNull(quizzes.deletedAt)))
    .returning({ id: quizzes.id });

  if (!deleted) {
    return apiError("notFound", "Quiz not found.", 404);
  }

  return NextResponse.json({ ok: true });
}
