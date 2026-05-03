"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { questions, quizzes, rounds } from "@meloman/db/schema";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { createDecadeQuestionSchema } from "@/lib/schemas/question";

export async function createDecadeQuestionAction(
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

  const parsed = createDecadeQuestionSchema.safeParse({
    questionText: formData.get("questionText"),
    correctYear: formData.get("correctYear"),
    timeLimitSeconds: formData.get("timeLimitSeconds"),
    pointsBase: formData.get("pointsBase"),
  });
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

  // Store the year as a plain integer in correctAnswer. The decade is derived
  // at scoring time so we don't carry redundant data.
  await db.insert(questions).values({
    roundId,
    questionType: "decade",
    questionText: parsed.data.questionText,
    correctAnswer: parsed.data.correctYear,
    acceptableAnswers: null,
    orderIndex: nextOrder,
    timeLimitSeconds: parsed.data.timeLimitSeconds,
    pointsBase: parsed.data.pointsBase,
  });

  const locale = await getLocale();
  redirect({ href: `/admin/quizzes/${quizId}/rounds/${roundId}`, locale });
}
