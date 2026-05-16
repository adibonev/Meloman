import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@meloman/db";
import { questions, rounds } from "@meloman/db/schema";
import { apiError, requireAdmin } from "@/lib/api/guard";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/rounds/[id] — round detail + its questions (admin).
 * DELETE /api/rounds/[id] — delete a round (cascades to questions).
 */
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const [round] = await db
    .select()
    .from(rounds)
    .where(eq(rounds.id, id))
    .limit(1);
  if (!round) {
    return apiError("notFound", "Round not found.", 404);
  }

  const roundQuestions = await db
    .select({
      id: questions.id,
      orderIndex: questions.orderIndex,
      questionType: questions.questionType,
      questionText: questions.questionText,
      timeLimitSeconds: questions.timeLimitSeconds,
      pointsBase: questions.pointsBase,
    })
    .from(questions)
    .where(eq(questions.roundId, id))
    .orderBy(asc(questions.orderIndex));

  return NextResponse.json({ round, questions: roundQuestions });
}

export async function DELETE(_request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const [deleted] = await db
    .delete(rounds)
    .where(eq(rounds.id, id))
    .returning({ id: rounds.id });

  if (!deleted) {
    return apiError("notFound", "Round not found.", 404);
  }

  return NextResponse.json({ ok: true });
}
