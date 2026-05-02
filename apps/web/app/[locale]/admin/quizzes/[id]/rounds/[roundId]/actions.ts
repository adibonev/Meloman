"use server";

import { and, eq } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { rounds } from "@meloman/db/schema";
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

  await db
    .update(rounds)
    .set({
      title: parsed.data.title,
      roundType: parsed.data.roundType,
      introSlideText: parsed.data.introSlideText ?? null,
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
