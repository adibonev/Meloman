import { NextResponse } from "next/server";
import { desc, isNull } from "drizzle-orm";
import { db } from "@meloman/db";
import { quizzes } from "@meloman/db/schema";
import { apiError, requireAdmin } from "@/lib/api/guard";
import { createQuizSchema } from "@/lib/schemas/quiz";

/**
 * GET /api/quizzes — list non-deleted quizzes (admin).
 * POST /api/quizzes — create a quiz (admin).
 *
 * Mirrors the data the admin Server Actions use so the REST surface and the
 * UI stay in sync; DB remains the single source of truth.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const rows = await db
    .select({
      id: quizzes.id,
      title: quizzes.title,
      description: quizzes.description,
      status: quizzes.status,
      theme: quizzes.theme,
      language: quizzes.language,
      createdAt: quizzes.createdAt,
    })
    .from(quizzes)
    .where(isNull(quizzes.deletedAt))
    .orderBy(desc(quizzes.createdAt));

  return NextResponse.json({ quizzes: rows });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalidJson", "Request body must be valid JSON.", 400);
  }

  const parsed = createQuizSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("invalidData", "Quiz payload failed validation.", 422);
  }

  const [created] = await db
    .insert(quizzes)
    .values({
      title: parsed.data.title,
      description: parsed.data.description,
      theme: parsed.data.theme,
      language: parsed.data.language,
      creatorId: guard.session.user.id,
    })
    .returning({ id: quizzes.id });

  return NextResponse.json({ quiz: created }, { status: 201 });
}
