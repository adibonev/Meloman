"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@meloman/db";
import { dailyContent } from "@meloman/db/schema";
import { auth } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  const role = session?.user?.role;
  return role === "admin" || role === "super_admin";
}

const TYPES = ["song_of_day", "mystery_artist"] as const;

export async function createDailyAction(formData: FormData) {
  if (!(await requireAdmin())) return { errorKey: "forbidden" as const };

  const date = String(formData.get("contentDate") ?? "");
  const type = String(formData.get("contentType") ?? "");
  const payloadRaw = String(formData.get("payload") ?? "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { errorKey: "invalid" as const };
  }
  if (!TYPES.includes(type as (typeof TYPES)[number])) {
    return { errorKey: "invalid" as const };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    return { errorKey: "invalid" as const };
  }
  if (payload === null || typeof payload !== "object") {
    return { errorKey: "invalid" as const };
  }

  // One row per date (unique). Upsert so re-saving a date overwrites it.
  await db
    .insert(dailyContent)
    .values({
      contentDate: date,
      contentType: type as (typeof TYPES)[number],
      payload,
    })
    .onConflictDoUpdate({
      target: dailyContent.contentDate,
      set: { contentType: type as (typeof TYPES)[number], payload },
    });

  revalidatePath("/admin/daily");
  return { ok: true as const };
}

export async function deleteDailyAction(id: string) {
  if (!(await requireAdmin())) return { errorKey: "forbidden" as const };
  await db.delete(dailyContent).where(eq(dailyContent.id, id));
  revalidatePath("/admin/daily");
  return { ok: true as const };
}
