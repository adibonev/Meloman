import { NextResponse } from "next/server";
import { apiError, requireUser } from "@/lib/api/guard";
import { submitTeamAnswer } from "@/lib/live-quiz/play-service";
import { submitAnswerSchema } from "@/lib/schemas/play";

type Params = { params: Promise<{ code: string }> };

// Same rule set as the web Server Action (shared via play-service);
// map the domain error to a sensible HTTP status.
const STATUS: Record<string, number> = {
  sessionNotFound: 404,
  teamNotFound: 404,
  sessionNotJoinable: 409,
  questionClosed: 409,
  alreadySubmitted: 409,
  notCaptain: 403,
  eliminated: 403,
  unsupportedQuestionType: 400,
};

/**
 * POST /api/sessions/[code]/answer — captain submits the team answer
 * (mobile). Body matches submitAnswerSchema. Captain-only / timer-window /
 * grading / dedupe are enforced server-side in play-service.
 */
export async function POST(request: Request, { params }: Params) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;
  const userId = guard.session.user.id;
  if (!userId) return apiError("unauthorized", "Not signed in.", 401);

  const { code } = await params;
  const body = await request.json().catch(() => null);
  const parsed = submitAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("invalidData", "Invalid answer payload.", 400);
  }

  const result = await submitTeamAnswer(userId, code, parsed.data);
  if ("errorKey" in result) {
    return apiError(
      result.errorKey,
      result.errorKey,
      STATUS[result.errorKey] ?? 400
    );
  }
  return NextResponse.json({ ok: true });
}
