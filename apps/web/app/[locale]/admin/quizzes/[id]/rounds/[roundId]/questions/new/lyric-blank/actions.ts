"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { questions, quizzes, rounds } from "@meloman/db/schema";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { createLyricBlankQuestionSchema } from "@/lib/schemas/question";

export async function createLyricBlankQuestionAction(
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

  // Answers come back as `answer.0`, `answer.1`, ... so we don't have to
  // serialize them into one string field.
  const answers: string[] = [];
  for (let i = 0; ; i++) {
    const value = formData.get(`answer.${i}`);
    if (value === null) break;
    answers.push(String(value).trim());
  }

  const parsed = createLyricBlankQuestionSchema.safeParse({
    lyricText: formData.get("lyricText"),
    answers,
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

  await db.insert(questions).values({
    roundId,
    questionType: "lyric_blank",
    questionText: parsed.data.lyricText,
    // Per-blank scoring: store the array of correct words. Acceptable
    // variations are not used here — fuzzy match would be too lenient when
    // 1 point hinges on a single word.
    correctAnswer: parsed.data.answers,
    acceptableAnswers: null,
    orderIndex: nextOrder,
    timeLimitSeconds: parsed.data.timeLimitSeconds,
    pointsBase: parsed.data.pointsBase,
  });

  const locale = await getLocale();
  redirect({ href: `/admin/quizzes/${quizId}/rounds/${roundId}`, locale });
}
