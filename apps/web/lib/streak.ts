import { desc, eq } from "drizzle-orm";
import { db } from "@meloman/db";
import { userProgress } from "@meloman/db/schema";

// Current streak = the denormalized streak length on the user's most
// recent progress row. 0 when the user has no progress yet.
export async function getCurrentStreak(userId: string): Promise<number> {
  const [row] = await db
    .select({ streak: userProgress.streakCountAtDay })
    .from(userProgress)
    .where(eq(userProgress.userId, userId))
    .orderBy(desc(userProgress.date))
    .limit(1);
  return row?.streak ?? 0;
}
