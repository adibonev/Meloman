"use server";

import { asc, eq } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { quizzes, rounds } from "@meloman/db/schema";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { updateQuizSchema } from "@/lib/schemas/quiz";

export async function updateQuizAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { errorKey: "unauthorized" as const };
  }
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    return { errorKey: "forbidden" as const };
  }

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    theme: formData.get("theme"),
    language: formData.get("language"),
    status: formData.get("status"),
  };

  const parsed = updateQuizSchema.safeParse(raw);
  if (!parsed.success) {
    return { errorKey: "invalidData" as const };
  }

  const [existing] = await db
    .select({ publishedAt: quizzes.publishedAt })
    .from(quizzes)
    .where(eq(quizzes.id, id))
    .limit(1);

  if (!existing) {
    return { errorKey: "notFound" as const };
  }

  // Stamp publishedAt the first time a quiz transitions to "published".
  // We don't clear it on archive — it preserves "first publish" history.
  const shouldStampPublishedAt =
    parsed.data.status === "published" && existing.publishedAt === null;

  await db
    .update(quizzes)
    .set({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      theme: parsed.data.theme,
      language: parsed.data.language,
      status: parsed.data.status,
      ...(shouldStampPublishedAt ? { publishedAt: new Date() } : {}),
    })
    .where(eq(quizzes.id, id));

  const locale = await getLocale();
  redirect({ href: "/admin/quizzes", locale });
}

export async function moveRoundAction(
  quizId: string,
  roundId: string,
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
    .select({ id: rounds.id, orderIndex: rounds.orderIndex })
    .from(rounds)
    .where(eq(rounds.quizId, quizId))
    .orderBy(asc(rounds.orderIndex));

  const idx = all.findIndex((r) => r.id === roundId);
  if (idx === -1) return { errorKey: "notFound" as const };

  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= all.length) {
    // Already at top/bottom — no-op, treat as success.
    return;
  }

  const current = all[idx];
  const neighbor = all[targetIdx];

  // Swap orderIndex sequentially. There is no UNIQUE(quizId, orderIndex)
  // constraint, so a brief overlap between the two updates is harmless.
  await db
    .update(rounds)
    .set({ orderIndex: current.orderIndex })
    .where(eq(rounds.id, neighbor.id));
  await db
    .update(rounds)
    .set({ orderIndex: neighbor.orderIndex })
    .where(eq(rounds.id, current.id));

  // Re-render the quiz detail page with fresh round order.
  const locale = await getLocale();
  redirect({ href: `/admin/quizzes/${quizId}`, locale });
}
