import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@meloman/db";
import { questions } from "@meloman/db/schema";
import { requireAdmin } from "@/lib/api/guard";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/rounds/[id]/questions — list questions for a round (admin).
 *
 * Question creation stays in the admin Server Actions because it involves
 * type-specific validation and R2 media uploads (multipart) that don't
 * belong in a JSON REST handler. Mobile/clients only ever read questions.
 */
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const rows = await db
    .select()
    .from(questions)
    .where(eq(questions.roundId, id))
    .orderBy(asc(questions.orderIndex));

  return NextResponse.json({ questions: rows });
}
