import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@meloman/db";
import { badges, userBadges, userProgress } from "@meloman/db/schema";
import { requireUser } from "@/lib/api/guard";

/**
 * GET /api/users/me/progress — streak, total XP and earned badges for the
 * signed-in user. Powers the web + mobile profile screens.
 */
export async function GET() {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const userId = guard.session.user.id;

  const [xpRow] = await db
    .select({
      totalXp: sql<number>`coalesce(sum(${userProgress.dailyXp}), 0)`,
    })
    .from(userProgress)
    .where(eq(userProgress.userId, userId));

  const [streakRow] = await db
    .select({ streak: userProgress.streakCountAtDay })
    .from(userProgress)
    .where(eq(userProgress.userId, userId))
    .orderBy(desc(userProgress.date))
    .limit(1);

  const earned = await db
    .select({
      slug: badges.slug,
      name: badges.name,
      earnedAt: userBadges.earnedAt,
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, userId))
    .orderBy(desc(userBadges.earnedAt));

  return NextResponse.json({
    progress: {
      totalXp: Number(xpRow?.totalXp ?? 0),
      streak: streakRow?.streak ?? 0,
      badges: earned,
    },
  });
}
