"use server";

import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { questions, rounds } from "@meloman/db/schema";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { uploadObject } from "@/lib/r2";
import {
  GUEST_VIDEO_ACCEPTED_MIME_TYPES,
  GUEST_VIDEO_MAX_SIZE_BYTES,
  createRoundSchema,
} from "@/lib/schemas/round";

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

// Guest-host final round (CLAUDE.md §3.1). The video file is binary so
// it can't ride the createRoundSchema text parse — handled separately,
// mirroring the audio-question upload: validate, upload to R2, store the
// key (never a signed URL) on rounds.guest_video_url.
export async function uploadRoundGuestVideoAction(
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

  const videoFile = formData.get("guestVideoFile");
  if (!(videoFile instanceof File) || videoFile.size === 0) {
    return { errorKey: "guestVideoMissing" as const };
  }
  if (videoFile.size > GUEST_VIDEO_MAX_SIZE_BYTES) {
    return { errorKey: "guestVideoTooLarge" as const };
  }
  if (
    !GUEST_VIDEO_ACCEPTED_MIME_TYPES.includes(
      videoFile.type as (typeof GUEST_VIDEO_ACCEPTED_MIME_TYPES)[number]
    )
  ) {
    return { errorKey: "guestVideoWrongType" as const };
  }

  const [existing] = await db
    .select({ id: rounds.id })
    .from(rounds)
    .where(and(eq(rounds.id, roundId), eq(rounds.quizId, quizId)))
    .limit(1);

  if (!existing) {
    return { errorKey: "notFound" as const };
  }

  // Upload first; if it fails we never write a half-baked DB row.
  const key = `round-video/${randomUUID()}.mp4`;
  try {
    const buffer = new Uint8Array(await videoFile.arrayBuffer());
    await uploadObject(key, buffer, "video/mp4");
  } catch (err) {
    console.error("R2 guest video upload failed:", err);
    return { errorKey: "uploadFailed" as const };
  }

  await db
    .update(rounds)
    .set({ guestVideoUrl: key })
    .where(eq(rounds.id, roundId));

  const locale = await getLocale();
  redirect({
    href: `/admin/quizzes/${quizId}/rounds/${roundId}`,
    locale,
  });
}

export async function removeRoundGuestVideoAction(
  quizId: string,
  roundId: string
) {
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

  // Detach the reference. The R2 object is left in place — same as the
  // rest of the admin (replaced audio isn't garbage-collected either);
  // a storage sweep is out of scope here.
  await db
    .update(rounds)
    .set({ guestVideoUrl: null })
    .where(eq(rounds.id, roundId));

  const locale = await getLocale();
  redirect({
    href: `/admin/quizzes/${quizId}/rounds/${roundId}`,
    locale,
  });
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
