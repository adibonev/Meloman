"use server";

import { randomUUID } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { db } from "@meloman/db";
import { questions, quizzes, rounds } from "@meloman/db/schema";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { uploadObject } from "@/lib/r2";
import {
  IMAGE_ACCEPTED_MIME_TYPES,
  IMAGE_MAX_SIZE_BYTES,
  createImageRevealQuestionMetadataSchema,
} from "@/lib/schemas/question";

const EXTENSION_BY_MIME: Record<
  (typeof IMAGE_ACCEPTED_MIME_TYPES)[number],
  string
> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function createImageRevealQuestionAction(
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

  const imageFile = formData.get("imageFile");
  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return { errorKey: "imageMissing" as const };
  }
  if (imageFile.size > IMAGE_MAX_SIZE_BYTES) {
    return { errorKey: "imageTooLarge" as const };
  }
  const mime = imageFile.type as (typeof IMAGE_ACCEPTED_MIME_TYPES)[number];
  if (!IMAGE_ACCEPTED_MIME_TYPES.includes(mime)) {
    return { errorKey: "imageWrongType" as const };
  }

  const rawAnswers = (formData.get("acceptableAnswers") ?? "").toString();
  const acceptableAnswers = rawAnswers
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const parsed = createImageRevealQuestionMetadataSchema.safeParse({
    questionText: formData.get("questionText"),
    acceptableAnswers,
    imageSource: formData.get("imageSource"),
    imageAttribution: formData.get("imageAttribution") ?? "",
    blurPx: formData.get("blurPx"),
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

  const ext = EXTENSION_BY_MIME[mime];
  const key = `quiz-images/${randomUUID()}.${ext}`;
  try {
    const buffer = new Uint8Array(await imageFile.arrayBuffer());
    await uploadObject(key, buffer, mime);
  } catch (err) {
    console.error("R2 image upload failed:", err);
    return { errorKey: "uploadFailed" as const };
  }

  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number | null>`max(${questions.orderIndex})` })
    .from(questions)
    .where(eq(questions.roundId, roundId));

  const nextOrder = maxOrder === null ? 0 : maxOrder + 1;

  await db.insert(questions).values({
    roundId,
    questionType: "image_reveal",
    questionText: parsed.data.questionText,
    correctAnswer: parsed.data.acceptableAnswers[0],
    acceptableAnswers: parsed.data.acceptableAnswers,
    mediaUrl: key,
    mediaSource: parsed.data.imageSource,
    mediaAttribution: parsed.data.imageAttribution ?? null,
    mediaBlurPx: parsed.data.blurPx,
    orderIndex: nextOrder,
    timeLimitSeconds: parsed.data.timeLimitSeconds,
    pointsBase: parsed.data.pointsBase,
  });

  const locale = await getLocale();
  redirect({ href: `/admin/quizzes/${quizId}/rounds/${roundId}`, locale });
}
