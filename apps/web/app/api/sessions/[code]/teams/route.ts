import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@meloman/db";
import { gameSessions, teams } from "@meloman/db/schema";
import { apiError, requireUser } from "@/lib/api/guard";
import { createTeam, joinTeam } from "@/lib/live-quiz/play-service";
import { createTeamSchema, joinTeamSchema } from "@/lib/schemas/play";

type Params = { params: Promise<{ code: string }> };

const TEAM_STATUS: Record<string, number> = {
  sessionNotFound: 404,
  sessionNotJoinable: 409,
  teamNotFound: 404,
  teamFull: 409,
  deviceAlreadyInSession: 409,
};

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

/**
 * POST /api/sessions/[code]/teams — create or join a team (mobile).
 * Body: { action: "create", name, deviceFingerprint }
 *     | { action: "join", teamId, deviceFingerprint }
 * Anti-cheat / capacity rules enforced server-side in play-service.
 */
export async function POST(request: Request, { params }: Params) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;
  const userId = guard.session.user.id;
  if (!userId) return apiError("unauthorized", "Not signed in.", 401);

  const { code } = await params;
  const body = (await request.json().catch(() => null)) as {
    action?: string;
  } | null;
  if (!body || (body.action !== "create" && body.action !== "join")) {
    return apiError("invalidData", "action must be 'create' or 'join'.", 400);
  }

  if (body.action === "create") {
    const parsed = createTeamSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("invalidData", "Invalid team payload.", 400);
    }
    const r = await createTeam(userId, code, parsed.data);
    if ("errorKey" in r) {
      return apiError(r.errorKey, r.errorKey, TEAM_STATUS[r.errorKey] ?? 400);
    }
    return NextResponse.json({ ok: true, teamId: r.teamId });
  }

  const parsed = joinTeamSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("invalidData", "Invalid team payload.", 400);
  }
  const r = await joinTeam(userId, code, parsed.data);
  if ("errorKey" in r) {
    return apiError(r.errorKey, r.errorKey, TEAM_STATUS[r.errorKey] ?? 400);
  }
  return NextResponse.json({ ok: true, teamId: r.teamId });
}
