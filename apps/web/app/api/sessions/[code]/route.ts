import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@meloman/db";
import { gameSessions } from "@meloman/db/schema";
import { apiError, requireUser } from "@/lib/api/guard";

type Params = { params: Promise<{ code: string }> };

/**
 * GET /api/sessions/[code] — current session state (poll fallback).
 *
 * Pusher is the primary realtime channel; this endpoint is the resilience
 * fallback (CLAUDE.md §5.4) and what the mobile client polls on reconnect.
 * `serverNow` lets clients compute their clock offset for the countdown.
 */
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const { code } = await params;

  const [s] = await db
    .select({
      id: gameSessions.id,
      status: gameSessions.status,
      currentQuestionId: gameSessions.currentQuestionId,
      questionStartedAt: gameSessions.questionStartedAt,
      questionEndsAt: gameSessions.questionEndsAt,
    })
    .from(gameSessions)
    .where(eq(gameSessions.joinCode, code.toUpperCase()))
    .limit(1);

  if (!s) {
    return apiError("notFound", "Session not found.", 404);
  }

  return NextResponse.json({
    session: s,
    serverNow: Date.now(),
  });
}
