// Shared live-quiz player service. The web Server Actions
// (app/[locale]/play/[code]/actions.ts) and the mobile-facing REST routes
// (app/api/sessions/[code]/...) both call these — one implementation, no
// duplicated grading / anti-cheat / scoring logic (CLAUDE.md §4).
//
// These functions take an explicit userId (the caller resolves auth: cookie
// session on web, bearer token on mobile), never touch FormData, and never
// redirect — they return typed results so each caller can respond in its
// own way (redirect vs JSON).
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@meloman/db";
import {
  answers,
  gameSessions,
  questions,
  quizzes,
  teamMembers,
  teams,
} from "@meloman/db/schema";
import { gradeAnswer } from "@/lib/live-quiz/grading";
import { broadcast, PUSHER_EVENTS, quizChannel } from "@/lib/pusher-server";
import {
  TEAM_COLORS,
  TEAM_EMOJIS,
  type CreateTeamInput,
  type JoinTeamInput,
  type SubmitAnswerInput,
} from "@/lib/schemas/play";

export type TeamMutationErrorKey =
  | "sessionNotFound"
  | "sessionNotJoinable"
  | "teamNotFound"
  | "teamFull"
  | "deviceAlreadyInSession";

export type SubmitAnswerErrorKey =
  | "sessionNotFound"
  | "sessionNotJoinable"
  | "teamNotFound"
  | "notCaptain"
  | "eliminated"
  | "questionClosed"
  | "alreadySubmitted"
  | "unsupportedQuestionType";

export type TeamMutationResult =
  | { errorKey: TeamMutationErrorKey }
  | { ok: true; teamId: string; code: string };

export type SubmitAnswerResult =
  | { errorKey: SubmitAnswerErrorKey }
  | { ok: true };

async function loadJoinableSession(code: string): Promise<
  | { error: "sessionNotFound" | "sessionNotJoinable" }
  | {
      session: { id: string; status: string; maxTeamSize: number | null };
      upperCode: string;
    }
> {
  const upperCode = code.toUpperCase();
  const [session] = await db
    .select({
      id: gameSessions.id,
      status: gameSessions.status,
      maxTeamSize: quizzes.maxTeamSize,
    })
    .from(gameSessions)
    .innerJoin(quizzes, eq(quizzes.id, gameSessions.quizId))
    .where(eq(gameSessions.joinCode, upperCode))
    .limit(1);
  if (!session) return { error: "sessionNotFound" as const };
  if (session.status !== "lobby") {
    return { error: "sessionNotJoinable" as const };
  }
  return { session, upperCode };
}

async function pickFreshTeamCosmetics(sessionId: string) {
  // Avoid colour/emoji collisions within a session so the host's TV view
  // can tell teams apart at a glance. If we run out (>8 teams), reuse —
  // the bar quiz will rarely have that many.
  const used = await db
    .select({ color: teams.color, avatarEmoji: teams.avatarEmoji })
    .from(teams)
    .where(eq(teams.sessionId, sessionId));
  const usedColors = new Set(used.map((u) => u.color));
  const usedEmojis = new Set(used.map((u) => u.avatarEmoji));
  const color = TEAM_COLORS.find((c) => !usedColors.has(c)) ?? TEAM_COLORS[0];
  const emoji =
    TEAM_EMOJIS.find((e) => !usedEmojis.has(e)) ?? TEAM_EMOJIS[0];
  return { color, emoji };
}

export async function createTeam(
  userId: string,
  code: string,
  input: CreateTeamInput
): Promise<TeamMutationResult> {
  const loaded = await loadJoinableSession(code);
  if ("error" in loaded) return { errorKey: loaded.error };

  // Anti-cheat: this device cannot already be a member of any team in this
  // session. The DB enforces UNIQUE(team_id, device_fp), but only per team —
  // we do the cross-team check here.
  const existingTeamIds = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.sessionId, loaded.session.id));
  if (existingTeamIds.length > 0) {
    const [clash] = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(
        and(
          inArray(
            teamMembers.teamId,
            existingTeamIds.map((t) => t.id)
          ),
          eq(teamMembers.deviceFingerprint, input.deviceFingerprint)
        )
      )
      .limit(1);
    if (clash) {
      return { errorKey: "deviceAlreadyInSession" };
    }
  }

  const cosmetics = await pickFreshTeamCosmetics(loaded.session.id);

  const [team] = await db
    .insert(teams)
    .values({
      sessionId: loaded.session.id,
      name: input.name,
      captainUserId: userId,
      color: cosmetics.color,
      avatarEmoji: cosmetics.emoji,
    })
    .returning({ id: teams.id });

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId,
    deviceFingerprint: input.deviceFingerprint,
  });

  // Notify the host page so its team list refreshes without a manual reload.
  await broadcast(quizChannel(loaded.upperCode), PUSHER_EVENTS.scoresUpdated, {
    reason: "team-created",
  });

  return { ok: true, teamId: team.id, code: loaded.upperCode };
}

export async function joinTeam(
  userId: string,
  code: string,
  input: JoinTeamInput
): Promise<TeamMutationResult> {
  const loaded = await loadJoinableSession(code);
  if ("error" in loaded) return { errorKey: loaded.error };

  // Verify the chosen team actually belongs to this session.
  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(
      and(
        eq(teams.id, input.teamId),
        eq(teams.sessionId, loaded.session.id)
      )
    )
    .limit(1);
  if (!team) return { errorKey: "teamNotFound" };

  // Cross-team device check (same as createTeam).
  const sessionTeamIds = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.sessionId, loaded.session.id));
  const [clash] = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(
      and(
        inArray(
          teamMembers.teamId,
          sessionTeamIds.map((t) => t.id)
        ),
        eq(teamMembers.deviceFingerprint, input.deviceFingerprint)
      )
    )
    .limit(1);
  if (clash) {
    return { errorKey: "deviceAlreadyInSession" };
  }

  // Capacity guard: enforce per-quiz max team size if configured. Only
  // applies to joining an existing team — createTeam implicitly seats one
  // member, which is always within bounds.
  if (loaded.session.maxTeamSize !== null) {
    const [{ value: memberCount }] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, input.teamId));
    if (memberCount >= loaded.session.maxTeamSize) {
      return { errorKey: "teamFull" };
    }
  }

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId,
    deviceFingerprint: input.deviceFingerprint,
  });

  await broadcast(quizChannel(loaded.upperCode), PUSHER_EVENTS.scoresUpdated, {
    reason: "member-joined",
  });

  return { ok: true, teamId: team.id, code: loaded.upperCode };
}

export async function submitTeamAnswer(
  userId: string,
  code: string,
  input: SubmitAnswerInput
): Promise<SubmitAnswerResult> {
  const upperCode = code.toUpperCase();
  const [session] = await db
    .select({
      id: gameSessions.id,
      status: gameSessions.status,
      currentQuestionId: gameSessions.currentQuestionId,
      questionStartedAt: gameSessions.questionStartedAt,
      questionEndsAt: gameSessions.questionEndsAt,
    })
    .from(gameSessions)
    .where(eq(gameSessions.joinCode, upperCode))
    .limit(1);

  if (!session) {
    return { errorKey: "sessionNotFound" };
  }
  if (session.status !== "active" || !session.currentQuestionId) {
    return { errorKey: "sessionNotJoinable" };
  }
  if (!session.questionStartedAt || !session.questionEndsAt) {
    return { errorKey: "sessionNotJoinable" };
  }

  const nowMs = Date.now();
  if (nowMs > session.questionEndsAt.valueOf()) {
    return { errorKey: "questionClosed" };
  }

  const [membership] = await db
    .select({
      teamId: teamMembers.teamId,
      captainUserId: teams.captainUserId,
      isActive: teams.isActive,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.teamId))
    .where(
      and(eq(teams.sessionId, session.id), eq(teamMembers.userId, userId))
    )
    .limit(1);

  if (!membership) {
    return { errorKey: "teamNotFound" };
  }
  if (membership.captainUserId !== userId) {
    return { errorKey: "notCaptain" };
  }
  // Cutoff guard: a team eliminated by an earlier round's
  // advancement_top_n cutoff is locked out of submitting on subsequent
  // questions. UI also disables submit, but defense-in-depth on the
  // server prevents a curl-level bypass.
  if (!membership.isActive) {
    return { errorKey: "eliminated" };
  }

  const [question] = await db
    .select({
      id: questions.id,
      questionType: questions.questionType,
      correctAnswer: questions.correctAnswer,
      acceptableAnswers: questions.acceptableAnswers,
      pointsBase: questions.pointsBase,
    })
    .from(questions)
    .where(eq(questions.id, session.currentQuestionId))
    .limit(1);

  if (!question) {
    return { errorKey: "unsupportedQuestionType" };
  }

  const grade = gradeAnswer(question, input);
  if (!grade) {
    return { errorKey: "unsupportedQuestionType" };
  }

  const timeToAnswerMs = Math.max(
    0,
    nowMs - session.questionStartedAt.valueOf()
  );

  const inserted = await db
    .insert(answers)
    .values({
      teamId: membership.teamId,
      questionId: question.id,
      submittedAnswer: grade.submittedAnswer,
      isCorrect: grade.isCorrect,
      timeToAnswerMs,
      pointsAwarded: grade.pointsAwarded,
    })
    .onConflictDoNothing()
    .returning({ id: answers.id });

  if (inserted.length === 0) {
    return { errorKey: "alreadySubmitted" };
  }

  if (grade.pointsAwarded > 0) {
    await db
      .update(teams)
      .set({ totalScore: sql`${teams.totalScore} + ${grade.pointsAwarded}` })
      .where(eq(teams.id, membership.teamId));
  }

  await broadcast(quizChannel(upperCode), PUSHER_EVENTS.scoresUpdated, {
    reason: "answer-submitted",
  });

  return { ok: true };
}
