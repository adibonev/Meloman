"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { questions, quizzes, rounds } from "@meloman/db/schema";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { createMultipleChoiceQuestionSchema } from "@/lib/schemas/question";

export async function createMultipleChoiceQuestionAction(
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

  const raw = {
    questionText: formData.get("questionText"),
    options: [
      formData.get("option0"),
      formData.get("option1"),
      formData.get("option2"),
      formData.get("option3"),
    ],
    correctIndex: formData.get("correctIndex"),
    timeLimitSeconds: formData.get("timeLimitSeconds"),
    pointsBase: formData.get("pointsBase"),
  };

  const parsed = createMultipleChoiceQuestionSchema.safeParse(raw);
  if (!parsed.success) {
    return { errorKey: "invalidData" as const };
  }

  // Verify the round belongs to a non-deleted quiz with this id, in one query.
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

  // Append the new question at the end of the round.
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number | null>`max(${questions.orderIndex})` })
    .from(questions)
    .where(eq(questions.roundId, roundId));

  const nextOrder = maxOrder === null ? 0 : maxOrder + 1;

  await db.insert(questions).values({
    roundId,
    questionType: "multiple_choice",
    questionText: parsed.data.questionText,
    options: parsed.data.options,
    correctAnswer: parsed.data.correctIndex,
    orderIndex: nextOrder,
    timeLimitSeconds: parsed.data.timeLimitSeconds,
    pointsBase: parsed.data.pointsBase,
  });

  const locale = await getLocale();
  redirect({ href: `/admin/quizzes/${quizId}/rounds/${roundId}`, locale });
}
