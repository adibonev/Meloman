import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@meloman/db";
import { questions } from "@meloman/db/schema";
import { apiError, requireAdmin } from "@/lib/api/guard";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/questions/[id] — full question detail (admin).
 * DELETE /api/questions/[id] — delete a question (admin).
 */
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const [question] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, id))
    .limit(1);

  if (!question) {
    return apiError("notFound", "Question not found.", 404);
  }

  return NextResponse.json({ question });
}

export async function DELETE(_request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const [deleted] = await db
    .delete(questions)
    .where(eq(questions.id, id))
    .returning({ id: questions.id });

  if (!deleted) {
    return apiError("notFound", "Question not found.", 404);
  }

  return NextResponse.json({ ok: true });
}
