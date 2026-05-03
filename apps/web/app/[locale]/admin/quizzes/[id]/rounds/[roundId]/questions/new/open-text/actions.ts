"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { questions, quizzes, rounds } from "@meloman/db/schema";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { createOpenTextQuestionSchema } from "@/lib/schemas/question";

export async function createOpenTextQuestionAction(
  quizId: string,
  roundId: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { errorKey: "unauthorized" as const };
  }
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    return { errorKey: "forbidden" as const };
  }

  // The form sends acceptable answers as one textarea, one per line.
  const rawAnswers = (formData.get("acceptableAnswers") ?? "").toString();
  const acceptableAnswers = rawAnswers
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const raw = {
    questionText: formData.get("questionText"),
    acceptableAnswers,
    timeLimitSeconds: formData.get("timeLimitSeconds"),
    pointsBase: formData.get("pointsBase"),
  };

  const parsed = createOpenTextQuestionSchema.safeParse(raw);
  if (!parsed.success) {
    return { errorKey: "invalidData" as const };
  }

  const [parent] = await db
    .select({ roundId: rounds.id })
    .from(rounds)
    .innerJoin(quizzes, eq(quizzes.id, rounds.quizId))
    .where(
      and(
        eq(rounds.id, roundId),
        eq(rounds.quizId, quizId),
        isNull(quizzes.deletedAt)
      )
    )
    .limit(1);

  if (!parent) {
    return { errorKey: "roundNotFound" as const };
  }

  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number | null>`max(${questions.orderIndex})` })
    .from(questions)
    .where(eq(questions.roundId, roundId));

  const nextOrder = maxOrder === null ? 0 : maxOrder + 1;

  // For open-text, the first acceptable answer is the canonical reveal label.
  // We persist the full list under acceptableAnswers and a copy of the first
  // entry under correctAnswer (notNull column) for symmetry with other types.
  await db.insert(questions).values({
    roundId,
    questionType: "open_text",
    questionText: parsed.data.questionText,
    correctAnswer: parsed.data.acceptableAnswers[0],
    acceptableAnswers: parsed.data.acceptableAnswers,
    orderIndex: nextOrder,
    timeLimitSeconds: parsed.data.timeLimitSeconds,
    pointsBase: parsed.data.pointsBase,
  });

  const locale = await getLocale();
  redirect({ href: `/admin/quizzes/${quizId}/rounds/${roundId}`, locale });
}
