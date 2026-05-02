"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { quizzes, rounds } from "@meloman/db/schema";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { createRoundSchema } from "@/lib/schemas/round";

export async function createRoundAction(quizId: string, formData: FormData) {
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
  };

  const parsed = createRoundSchema.safeParse(raw);
  if (!parsed.success) {
    return { errorKey: "invalidData" as const };
  }

  const [quiz] = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .where(and(eq(quizzes.id, quizId), isNull(quizzes.deletedAt)))
    .limit(1);

  if (!quiz) {
    return { errorKey: "quizNotFound" as const };
  }

  // Append the new round at the end. We compute next orderIndex via aggregate
  // rather than counting rows, so deleted-then-re-added rounds don't collide.
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number | null>`max(${rounds.orderIndex})` })
    .from(rounds)
    .where(eq(rounds.quizId, quizId));

  const nextOrder = maxOrder === null ? 0 : maxOrder + 1;

  await db.insert(rounds).values({
    quizId,
    title: parsed.data.title,
    roundType: parsed.data.roundType,
    introSlideText: parsed.data.introSlideText ?? null,
    orderIndex: nextOrder,
  });

  const locale = await getLocale();
  redirect({ href: `/admin/quizzes/${quizId}`, locale });
}
