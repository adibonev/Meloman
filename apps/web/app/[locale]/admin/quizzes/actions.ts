"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@meloman/db";
import { quizzes } from "@meloman/db/schema";
import { auth } from "@/auth";

/**
 * Soft-delete a quiz: stamp deleted_at so it drops out of every list query
 * (which all filter `isNull(deletedAt)`) while the rows stay recoverable.
 * Sessions/rounds/questions are untouched.
 */
export async function deleteQuizAction(id: string) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "admin" && role !== "super_admin") {
    return { errorKey: "forbidden" as const };
  }

  await db
    .update(quizzes)
    .set({ deletedAt: new Date() })
    .where(eq(quizzes.id, id));

  revalidatePath("/admin/quizzes");
  return { ok: true as const };
}
