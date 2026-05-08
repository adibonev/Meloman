"use server";

import { and, asc, eq } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { questions, rounds } from "@meloman/db/schema";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { createRoundSchema } from "@/lib/schemas/round";

export async function updateRoundAction(
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
    title: formData.get("title"),
    roundType: formData.get("roundType"),
    introSlideText: formData.get("introSlideText") ?? "",
    advancementTopN: formData.get("advancementTopN") ?? 0,
  };

  const parsed = createRoundSchema.safeParse(raw);
  if (!parsed.success) {
    return { errorKey: "invalidData" as const };
  }

  const [existing] = await db
    .select({ id: rounds.id })
    .from(rounds)
    .where(and(eq(rounds.id, roundId), eq(rounds.quizId, quizId)))
    .limit(1);

  if (!existing) {
    return { errorKey: "notFound" as const };
  }

  // Schema enforces 0 as "no cutoff" but we store NULL in the DB so the
  // type stays "missing" rather than "explicit zero". Aligns with the
  // server logic in applyRoundCutoff which short-circuits on null.
  await db
    .update(rounds)
    .set({
      title: parsed.data.title,
      roundType: parsed.data.roundType,
      introSlideText: parsed.data.introSlideText ?? null,
      advancementTopN:
        parsed.data.advancementTopN > 0 ? parsed.data.advancementTopN : null,
    })
    .where(eq(rounds.id, roundId));

  const locale = await getLocale();
  redirect({ href: `/admin/quizzes/${quizId}`, locale });
}

export async function deleteRoundAction(quizId: string, roundId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { errorKey: "unauthorized" as const };
  }
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    return { errorKey: "forbidden" as const };
  }

  const [existing] = await db
    .select({ id: rounds.id })
    .from(rounds)
    .where(and(eq(rounds.id, roundId), eq(rounds.quizId, quizId)))
    .limit(1);

  if (!existing) {
    return { errorKey: "notFound" as const };
  }

  await db.delete(rounds).where(eq(rounds.id, roundId));

  const locale = await getLocale();
  redirect({ href: `/admin/quizzes/${quizId}`, locale });
}

export async function deleteQuestionAction(
  quizId: string,
  roundId: string,
  questionId: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { errorKey: "unauthorized" as const };
  }
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    return { errorKey: "forbidden" as const };
  }

  const [existing] = await db
    .select({ id: questions.id })
    .from(questions)
    .where(
      and(eq(questions.id, questionId), eq(questions.roundId, roundId))
    )
    .limit(1);

  if (!existing) {
    return { errorKey: "notFound" as const };
  }

  await db.delete(questions).where(eq(questions.id, questionId));

  const locale = await getLocale();
  redirect({
    href: `/admin/quizzes/${quizId}/rounds/${roundId}`,
    locale,
  });
}

export async function moveQuestionAction(
  quizId: string,
  roundId: string,
  questionId: string,
  direction: "up" | "down"
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { errorKey: "unauthorized" as const };
  }
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    return { errorKey: "forbidden" as const };
  }

  const all = await db
    .select({ id: questions.id, orderIndex: questions.orderIndex })
    .from(questions)
    .where(eq(questions.roundId, roundId))
    .orderBy(asc(questions.orderIndex));

  const idx = all.findIndex((q) => q.id === questionId);
  if (idx === -1) return { errorKey: "notFound" as const };

  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= all.length) {
    // No-op at boundary, treat as success.
    return;
  }

  const current = all[idx];
  const neighbor = all[targetIdx];

  // Same swap pattern as moveRoundAction: no UNIQUE(roundId, orderIndex)
  // constraint, so a brief overlap between the two updates is harmless.
  await db
    .update(questions)
    .set({ orderIndex: current.orderIndex })
    .where(eq(questions.id, neighbor.id));
  await db
    .update(questions)
    .set({ orderIndex: neighbor.orderIndex })
    .where(eq(questions.id, current.id));

  const locale = await getLocale();
  redirect({
    href: `/admin/quizzes/${quizId}/rounds/${roundId}`,
    locale,
  });
}
