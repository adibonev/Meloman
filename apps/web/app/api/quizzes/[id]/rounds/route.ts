import { NextResponse } from "next/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@meloman/db";
import { quizzes, rounds } from "@meloman/db/schema";
import { apiError, requireAdmin } from "@/lib/api/guard";
import { createRoundSchema } from "@/lib/schemas/round";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/quizzes/[id]/rounds — list rounds for a quiz (admin).
 * POST /api/quizzes/[id]/rounds — append a round (admin).
 *
 * order_index is server-assigned (count of existing rounds) so REST callers
 * can't create gaps or collisions.
 */
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const rows = await db
    .select()
    .from(rounds)
    .where(eq(rounds.quizId, id))
    .orderBy(asc(rounds.orderIndex));

  return NextResponse.json({ rounds: rows });
}

export async function POST(request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  const [quiz] = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .where(and(eq(quizzes.id, id), isNull(quizzes.deletedAt)))
    .limit(1);
  if (!quiz) {
    return apiError("notFound", "Quiz not found.", 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalidJson", "Request body must be valid JSON.", 400);
  }

  const parsed = createRoundSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("invalidData", "Round payload failed validation.", 422);
  }

  const existing = await db
    .select({ orderIndex: rounds.orderIndex })
    .from(rounds)
    .where(eq(rounds.quizId, id));
  const nextOrderIndex = existing.length;

  const [created] = await db
    .insert(rounds)
    .values({
      quizId: id,
      title: parsed.data.title,
      roundType: parsed.data.roundType,
      introSlideText: parsed.data.introSlideText,
      advancementTopN:
        parsed.data.advancementTopN === 0
          ? null
          : parsed.data.advancementTopN,
      orderIndex: nextOrderIndex,
    })
    .returning({ id: rounds.id });

  return NextResponse.json({ round: created }, { status: 201 });
}
