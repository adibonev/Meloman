"use server";

import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { db } from "@meloman/db";
import {
  gameSessions,
  quizSponsors,
  quizzes,
  rounds,
  sponsors,
} from "@meloman/db/schema";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { generateJoinCode } from "@/lib/join-code";
import { updateQuizSchema } from "@/lib/schemas/quiz";

export async function updateQuizAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { errorKey: "unauthorized" as const };
  }
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    return { errorKey: "forbidden" as const };
  }

  const sponsorIds = Array.from(
    new Set(
      formData
        .getAll("sponsorIds")
        .filter((value): value is string => typeof value === "string")
        .filter(Boolean)
    )
  );
  const raw = {
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    theme: formData.get("theme"),
    language: formData.get("language"),
    status: formData.get("status"),
    maxTeamSize: formData.get("maxTeamSize") ?? 0,
    sponsorIds,
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

  const parsedSponsorIds = parsed.data.sponsorIds ?? [];
  if (parsedSponsorIds.length > 0) {
    const existingSponsors = await db
      .select({ id: sponsors.id })
      .from(sponsors)
      .where(inArray(sponsors.id, parsedSponsorIds));

    if (existingSponsors.length !== parsedSponsorIds.length) {
      return { errorKey: "invalidData" as const };
    }
  }

  await db
    .update(quizzes)
    .set({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      theme: parsed.data.theme,
      language: parsed.data.language,
      status: parsed.data.status,
      maxTeamSize:
        parsed.data.maxTeamSize > 0 ? parsed.data.maxTeamSize : null,
      sponsorId: parsedSponsorIds[0] ?? null,
      ...(shouldStampPublishedAt ? { publishedAt: new Date() } : {}),
    })
    .where(eq(quizzes.id, id));

  // Neon HTTP driver used by this project does not support transactions,
  // so keep this as simple sequential writes. The legacy quizzes.sponsorId
  // above always mirrors the first selection as a fallback if this write is
  // interrupted.
  await db.delete(quizSponsors).where(eq(quizSponsors.quizId, id));

  if (parsedSponsorIds.length > 0) {
    await db.insert(quizSponsors).values(
      parsedSponsorIds.map((sponsorId) => ({
        quizId: id,
        sponsorId,
      }))
    );
  }

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

export async function startSessionAction(quizId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { errorKey: "unauthorized" as const };
  }
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    return { errorKey: "forbidden" as const };
  }

  const [quiz] = await db
    .select({ id: quizzes.id, status: quizzes.status })
    .from(quizzes)
    .where(and(eq(quizzes.id, quizId), isNull(quizzes.deletedAt)))
    .limit(1);

  if (!quiz) {
    return { errorKey: "notFound" as const };
  }
  if (quiz.status !== "published") {
    return { errorKey: "notPublished" as const };
  }

  // Find a free join code. The space is ~887M codes, so collisions are rare;
  // 5 attempts is generous. If it fails consistently, something else is
  // wrong (RNG source, table corruption) — bubble up as a generic error.
  let joinCode: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateJoinCode();
    const [clash] = await db
      .select({ id: gameSessions.id })
      .from(gameSessions)
      .where(eq(gameSessions.joinCode, candidate))
      .limit(1);
    if (!clash) {
      joinCode = candidate;
      break;
    }
  }
  if (!joinCode) {
    return { errorKey: "joinCodeCollision" as const };
  }

  await db.insert(gameSessions).values({
    quizId: quiz.id,
    hostId: session.user.id,
    joinCode,
    status: "lobby",
  });

  const locale = await getLocale();
  redirect({ href: `/host/${joinCode}`, locale });
}
