"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@meloman/db";
import { gameSessions } from "@meloman/db/schema";
import { auth } from "@/auth";

// Host-only: opt this session in/out of the public /events page and
// set its venue. Isolated from the live-game actions on purpose.
export async function setPublicEventAction(code: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const upper = code.toUpperCase();
  const [row] = await db
    .select({ hostId: gameSessions.hostId })
    .from(gameSessions)
    .where(eq(gameSessions.joinCode, upper))
    .limit(1);
  if (!row || row.hostId !== session.user.id) return;

  const isPublic = formData.get("publicEvent") === "on";
  const venueRaw = formData.get("venue");
  const venue =
    typeof venueRaw === "string" && venueRaw.trim()
      ? venueRaw.trim().slice(0, 160)
      : null;

  // <input type="datetime-local"> yields a naive "YYYY-MM-DDTHH:mm"
  // string. We parse and display without an explicit timeZone, so the
  // wall-clock the host types is the wall-clock shown on /events.
  const parseDateTime = (key: string): Date | null => {
    const raw = formData.get(key);
    if (typeof raw !== "string" || !raw.trim()) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const scheduledStartAt = parseDateTime("scheduledStartAt");
  const scheduledEndAt = parseDateTime("scheduledEndAt");

  await db
    .update(gameSessions)
    .set({ publicEvent: isPublic, venue, scheduledStartAt, scheduledEndAt })
    .where(eq(gameSessions.joinCode, upper));

  revalidatePath(`/host/${upper}`);
}
