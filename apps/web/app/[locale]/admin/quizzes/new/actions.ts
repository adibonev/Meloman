"use server";

import { db } from "@meloman/db";
import { quizzes } from "@meloman/db/schema";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createQuizSchema } from "@/lib/schemas/quiz";

export async function createQuizAction(formData: FormData) {
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
  };

  const parsed = createQuizSchema.safeParse(raw);
  if (!parsed.success) {
    return { errorKey: "invalidData" as const };
  }

  await db.insert(quizzes).values({
    title: parsed.data.title,
    description: parsed.data.description,
    theme: parsed.data.theme,
    language: parsed.data.language,
    creatorId: session.user.id,
  });

  const locale = await getLocale();
  redirect({ href: "/admin/quizzes", locale });
}
