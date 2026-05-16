import { NextResponse } from "next/server";
import { apiError, requireUser } from "@/lib/api/guard";
import { getPlayState } from "@/lib/live-quiz/play-service";

type Params = { params: Promise<{ code: string }> };

/**
 * GET /api/sessions/[code]/play — everything a player phone needs in one
 * read (session status, current question without the answer until reveal,
 * the player's team, members, submit state, leaderboard). The mobile app
 * polls this; it doubles as the Pusher fallback (CLAUDE.md §5.4).
 */
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;
  const userId = guard.session.user.id;
  if (!userId) return apiError("unauthorized", "Not signed in.", 401);

  const { code } = await params;
  const state = await getPlayState(userId, code);
  if ("errorKey" in state) {
    return apiError("notFound", "Session not found.", 404);
  }
  return NextResponse.json(state);
}
