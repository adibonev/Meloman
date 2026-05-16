import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@meloman/db";
import { gameSessions, teams } from "@meloman/db/schema";
import { apiError, requireUser } from "@/lib/api/guard";

type Params = { params: Promise<{ code: string }> };

/**
 * GET /api/sessions/[code]/teams — leaderboard for a session.
 *
 * Ordered by total_score (denormalized for fast leaderboard reads). Used by
 * the poll fallback and the mobile leaderboard view.
 */
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const { code } = await params;

  const [s] = await db
    .select({ id: gameSessions.id })
    .from(gameSessions)
    .where(eq(gameSessions.joinCode, code.toUpperCase()))
    .limit(1);
  if (!s) {
    return apiError("notFound", "Session not found.", 404);
  }

  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      totalScore: teams.totalScore,
      isActive: teams.isActive,
      color: teams.color,
      avatarEmoji: teams.avatarEmoji,
    })
    .from(teams)
    .where(eq(teams.sessionId, s.id))
    .orderBy(desc(teams.totalScore));

  return NextResponse.json({ teams: rows });
}
