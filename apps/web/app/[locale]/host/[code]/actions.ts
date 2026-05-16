"use server";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@meloman/db";
import {
  answers,
  gameSessions,
  questions,
  rounds,
  teams,
} from "@meloman/db/schema";
import { auth } from "@/auth";
import { broadcast, PUSHER_EVENTS, quizChannel } from "@/lib/pusher-server";

type HostActionErrorKey =
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "invalidState"
  | "noQuestions"
  | "noCurrentQuestion"
  | "answerNotFound"
  | "wrongQuestionType"
  | "generic";

type HostActionResult = { errorKey: HostActionErrorKey } | { ok: true };

type SessionStatus =
  | "lobby"
  | "active"
  | "reveal"
  | "between_rounds"
  | "paused"
  | "finished";

type HostSessionRow = {
  id: string;
  hostId: string;
  status: SessionStatus;
  quizId: string;
  currentQuestionId: string | null;
  questionStartedAt: Date | null;
  questionEndsAt: Date | null;
  pausedAt: Date | null;
  pausedFromStatus: SessionStatus | null;
};

async function loadHostSession(code: string): Promise<
  | { errorKey: HostActionErrorKey }
  | { session: HostSessionRow; upperCode: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { errorKey: "unauthorized" };
  }

  const upperCode = code.toUpperCase();
  const [row] = await db
    .select({
      id: gameSessions.id,
      hostId: gameSessions.hostId,
      status: gameSessions.status,
      quizId: gameSessions.quizId,
      currentQuestionId: gameSessions.currentQuestionId,
      questionStartedAt: gameSessions.questionStartedAt,
      questionEndsAt: gameSessions.questionEndsAt,
      pausedAt: gameSessions.pausedAt,
      pausedFromStatus: gameSessions.pausedFromStatus,
    })
    .from(gameSessions)
    .where(eq(gameSessions.joinCode, upperCode))
    .limit(1);

  if (!row) {
    return { errorKey: "notFound" };
  }
  if (row.hostId !== session.user.id) {
    return { errorKey: "forbidden" };
  }

  return {
    session: {
      id: row.id,
      hostId: row.hostId,
      status: row.status,
      quizId: row.quizId,
      currentQuestionId: row.currentQuestionId ?? null,
      questionStartedAt: row.questionStartedAt ?? null,
      questionEndsAt: row.questionEndsAt ?? null,
      pausedAt: row.pausedAt ?? null,
      pausedFromStatus: row.pausedFromStatus ?? null,
    },
    upperCode,
  };
}

// Per-round cutoff: takes the currently-active teams (is_active=true),
// keeps the top N by total_score, marks the rest as is_active=false.
// Returns the number of teams eliminated. No-op if topN is null or
// covers the whole field. Idempotent on its own — calling it twice with
// the same N would have no effect because the bottom teams are already
// inactive after the first call.
async function applyRoundCutoff(
  sessionId: string,
  topN: number | null
): Promise<number> {
  if (topN === null || topN <= 0) return 0;

  const active = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.sessionId, sessionId), eq(teams.isActive, true)))
    .orderBy(desc(teams.totalScore), asc(teams.joinedAt));

  if (active.length <= topN) return 0;

  const eliminatedIds = active.slice(topN).map((t) => t.id);
  if (eliminatedIds.length === 0) return 0;

  await db
    .update(teams)
    .set({ isActive: false })
    .where(inArray(teams.id, eliminatedIds));

  return eliminatedIds.length;
}

async function loadOrderedQuestions(quizId: string) {
  return db
    .select({
      id: questions.id,
      timeLimitSeconds: questions.timeLimitSeconds,
      roundId: questions.roundId,
      roundType: rounds.roundType,
      advancementTopN: rounds.advancementTopN,
    })
    .from(questions)
    .innerJoin(rounds, eq(rounds.id, questions.roundId))
    .where(eq(rounds.quizId, quizId))
    .orderBy(asc(rounds.orderIndex), asc(questions.orderIndex));
}

export async function startQuizAction(code: string): Promise<HostActionResult> {
  const loaded = await loadHostSession(code);
  if ("errorKey" in loaded) return loaded;

  const { session, upperCode } = loaded;

  if (session.status !== "lobby") {
    return { errorKey: "invalidState" };
  }

  const ordered = await loadOrderedQuestions(session.quizId);
  if (ordered.length === 0) {
    return { errorKey: "noQuestions" };
  }

  const first = ordered[0];

  const nowMs = Date.now();
  const startedAt = new Date(nowMs);
  const endsAt = new Date(
    nowMs + Math.max(1, first.timeLimitSeconds) * 1000
  );

  await db
    .update(gameSessions)
    .set({
      status: "active",
      currentQuestionId: first.id,
      questionStartedAt: startedAt,
      questionEndsAt: endsAt,
      startedAt,
    })
    .where(eq(gameSessions.id, session.id));

  await broadcast(quizChannel(upperCode), PUSHER_EVENTS.questionStarted, {
    questionId: first.id,
    startedAt: startedAt.valueOf(),
    endsAt: endsAt.valueOf(),
    serverNow: nowMs,
  });

  return { ok: true };
}

export async function revealAnswerAction(
  code: string
): Promise<HostActionResult> {
  const loaded = await loadHostSession(code);
  if ("errorKey" in loaded) return loaded;

  const { session, upperCode } = loaded;

  if (session.status !== "active") {
    return { errorKey: "invalidState" };
  }
  if (!session.currentQuestionId) {
    return { errorKey: "noCurrentQuestion" };
  }

  await db
    .update(gameSessions)
    .set({ status: "reveal" })
    .where(eq(gameSessions.id, session.id));

  await broadcast(quizChannel(upperCode), PUSHER_EVENTS.questionRevealed, {
    questionId: session.currentQuestionId,
    serverNow: Date.now(),
  });

  return { ok: true };
}

export async function nextQuestionAction(
  code: string
): Promise<HostActionResult> {
  const loaded = await loadHostSession(code);
  if ("errorKey" in loaded) return loaded;

  const { session, upperCode } = loaded;

  if (session.status !== "reveal") {
    return { errorKey: "invalidState" };
  }
  if (!session.currentQuestionId) {
    return { errorKey: "noCurrentQuestion" };
  }

  const ordered = await loadOrderedQuestions(session.quizId);
  if (ordered.length === 0) {
    return { errorKey: "noQuestions" };
  }

  const index = ordered.findIndex(
    (question) => question.id === session.currentQuestionId
  );
  if (index === -1) {
    return { errorKey: "noCurrentQuestion" };
  }

  const next = ordered[index + 1];
  if (!next) {
    const finishedAt = new Date();
    await db
      .update(gameSessions)
      .set({ status: "finished", finishedAt })
      .where(eq(gameSessions.id, session.id));

    await broadcast(quizChannel(upperCode), PUSHER_EVENTS.sessionFinished, {
      serverNow: finishedAt.valueOf(),
    });

    return { ok: true };
  }

  // Round transition: if the next question lives in a different round, we
  // pause for the inter-round leaderboard slide instead of starting the
  // next question immediately. The host clicks "Continue" again to apply
  // the cutoff and start round N+1. continueFromBetweenRoundsAction
  // handles that second click.
  const current = ordered[index];
  if (next.roundId !== current.roundId) {
    await db
      .update(gameSessions)
      .set({ status: "between_rounds" })
      .where(eq(gameSessions.id, session.id));

    await broadcast(quizChannel(upperCode), PUSHER_EVENTS.scoresUpdated, {
      reason: "between-rounds",
    });

    return { ok: true };
  }

  const nowMs = Date.now();
  const startedAt = new Date(nowMs);
  const endsAt = new Date(nowMs + Math.max(1, next.timeLimitSeconds) * 1000);

  await db
    .update(gameSessions)
    .set({
      status: "active",
      currentQuestionId: next.id,
      questionStartedAt: startedAt,
      questionEndsAt: endsAt,
    })
    .where(eq(gameSessions.id, session.id));

  await broadcast(quizChannel(upperCode), PUSHER_EVENTS.questionStarted, {
    questionId: next.id,
    startedAt: startedAt.valueOf(),
    endsAt: endsAt.valueOf(),
    serverNow: nowMs,
  });

  return { ok: true };
}

export async function continueFromBetweenRoundsAction(
  code: string
): Promise<HostActionResult> {
  const loaded = await loadHostSession(code);
  if ("errorKey" in loaded) return loaded;

  const { session, upperCode } = loaded;

  if (session.status !== "between_rounds") {
    return { errorKey: "invalidState" };
  }
  if (!session.currentQuestionId) {
    return { errorKey: "noCurrentQuestion" };
  }

  const ordered = await loadOrderedQuestions(session.quizId);
  if (ordered.length === 0) {
    return { errorKey: "noQuestions" };
  }

  const index = ordered.findIndex(
    (question) => question.id === session.currentQuestionId
  );
  if (index === -1) {
    return { errorKey: "noCurrentQuestion" };
  }

  const current = ordered[index];
  const next = ordered[index + 1];
  if (!next) {
    // No more questions after this round even though we're sitting in
    // between_rounds — treat as "finish the quiz now". Shouldn't happen
    // with normal data because the round transition only fires when a
    // next question exists, but defensive.
    const finishedAt = new Date();
    await db
      .update(gameSessions)
      .set({ status: "finished", finishedAt })
      .where(eq(gameSessions.id, session.id));

    await broadcast(quizChannel(upperCode), PUSHER_EVENTS.sessionFinished, {
      serverNow: finishedAt.valueOf(),
    });

    return { ok: true };
  }

  // Apply the cutoff for the round we just finished. The cutoff config
  // lives on the previous round (current.advancementTopN means "after
  // this round, top N continue").
  await applyRoundCutoff(session.id, current.advancementTopN);

  const nowMs = Date.now();
  const startedAt = new Date(nowMs);
  const endsAt = new Date(nowMs + Math.max(1, next.timeLimitSeconds) * 1000);

  await db
    .update(gameSessions)
    .set({
      status: "active",
      currentQuestionId: next.id,
      questionStartedAt: startedAt,
      questionEndsAt: endsAt,
    })
    .where(eq(gameSessions.id, session.id));

  await broadcast(quizChannel(upperCode), PUSHER_EVENTS.questionStarted, {
    questionId: next.id,
    startedAt: startedAt.valueOf(),
    endsAt: endsAt.valueOf(),
    serverNow: nowMs,
  });

  return { ok: true };
}

export async function pauseSessionAction(
  code: string
): Promise<HostActionResult> {
  const loaded = await loadHostSession(code);
  if ("errorKey" in loaded) return loaded;

  const { session, upperCode } = loaded;

  // Pause is only valid from `active` or `reveal`. Lobby has no timer to
  // freeze; paused→paused is a no-op; finished sessions stay finished.
  if (session.status !== "active" && session.status !== "reveal") {
    return { errorKey: "invalidState" };
  }

  const pausedAt = new Date();

  await db
    .update(gameSessions)
    .set({
      status: "paused",
      pausedAt,
      pausedFromStatus: session.status,
    })
    .where(eq(gameSessions.id, session.id));

  await broadcast(quizChannel(upperCode), PUSHER_EVENTS.sessionPaused, {
    pausedAt: pausedAt.valueOf(),
    serverNow: pausedAt.valueOf(),
  });

  return { ok: true };
}

export async function resumeSessionAction(
  code: string
): Promise<HostActionResult> {
  const loaded = await loadHostSession(code);
  if ("errorKey" in loaded) return loaded;

  const { session, upperCode } = loaded;

  if (session.status !== "paused") {
    return { errorKey: "invalidState" };
  }
  // Defensive: pausedFromStatus must be one of active/reveal. If it ever
  // got into an unexpected state (e.g. manual DB edit), bail rather than
  // silently corrupt the session.
  const target = session.pausedFromStatus;
  if (target !== "active" && target !== "reveal") {
    return { errorKey: "invalidState" };
  }

  const nowMs = Date.now();
  const pauseDurationMs = session.pausedAt
    ? Math.max(0, nowMs - session.pausedAt.valueOf())
    : 0;

  // Only `active` carries a live timer; for reveal, we just flip status back.
  // Shifting both timestamps preserves the player's remaining time and keeps
  // time-to-answer math accurate (CLAUDE.md §4.4 server-authoritative timing).
  const shouldShiftTimer =
    target === "active" &&
    session.questionStartedAt !== null &&
    session.questionEndsAt !== null;
  const nextStartedAt = shouldShiftTimer
    ? new Date(session.questionStartedAt!.valueOf() + pauseDurationMs)
    : session.questionStartedAt;
  const nextEndsAt = shouldShiftTimer
    ? new Date(session.questionEndsAt!.valueOf() + pauseDurationMs)
    : session.questionEndsAt;

  await db
    .update(gameSessions)
    .set({
      status: target,
      pausedAt: null,
      pausedFromStatus: null,
      questionStartedAt: nextStartedAt,
      questionEndsAt: nextEndsAt,
    })
    .where(eq(gameSessions.id, session.id));

  await broadcast(quizChannel(upperCode), PUSHER_EVENTS.sessionResumed, {
    status: target,
    questionStartedAt: nextStartedAt?.valueOf() ?? null,
    questionEndsAt: nextEndsAt?.valueOf() ?? null,
    serverNow: nowMs,
  });

  return { ok: true };
}

// Question types where override makes sense. Multiple choice / decade are
// auto-graded against unambiguous values; lyric_blank scoring is per-blank
// and we don't yet expose per-blank override in the UI.
const OVERRIDABLE_QUESTION_TYPES = ["open_text", "audio", "image_reveal"] as const;
type OverridableType = (typeof OVERRIDABLE_QUESTION_TYPES)[number];

function isOverridable(value: string): value is OverridableType {
  return (OVERRIDABLE_QUESTION_TYPES as readonly string[]).includes(value);
}

export async function overrideAnswerAction(
  code: string,
  answerId: string,
  markCorrect: boolean
): Promise<HostActionResult> {
  const loaded = await loadHostSession(code);
  if ("errorKey" in loaded) return loaded;

  const { session, upperCode } = loaded;

  // Override is only meaningful while we're showing the answer. Earlier
  // states would let the host pre-decide; later states (finished) should
  // not move the leaderboard. Allow paused so a host who paused mid-reveal
  // can still adjudicate.
  if (
    session.status !== "reveal" &&
    !(session.status === "paused" && session.pausedFromStatus === "reveal")
  ) {
    return { errorKey: "invalidState" };
  }

  // Pull the answer joined to its team and question. The team must belong
  // to this session — otherwise a host could mutate scores in someone
  // else's quiz by guessing answer ids.
  const [row] = await db
    .select({
      answerId: answers.id,
      teamId: answers.teamId,
      teamSessionId: teams.sessionId,
      pointsAwarded: answers.pointsAwarded,
      isCorrect: answers.isCorrect,
      questionType: questions.questionType,
      pointsBase: questions.pointsBase,
    })
    .from(answers)
    .innerJoin(teams, eq(teams.id, answers.teamId))
    .innerJoin(questions, eq(questions.id, answers.questionId))
    .where(and(eq(answers.id, answerId), eq(teams.sessionId, session.id)))
    .limit(1);

  if (!row) {
    return { errorKey: "answerNotFound" };
  }
  if (!isOverridable(row.questionType)) {
    return { errorKey: "wrongQuestionType" };
  }

  const newPoints = markCorrect ? row.pointsBase : 0;
  const delta = newPoints - row.pointsAwarded;

  // No-op short-circuit: nothing to update if the requested state matches
  // current state. Still set host_override flag so the audit trail shows
  // a human reviewed it.
  await db
    .update(answers)
    .set({
      isCorrect: markCorrect,
      pointsAwarded: newPoints,
      hostOverride: true,
    })
    .where(eq(answers.id, row.answerId));

  if (delta !== 0) {
    await db
      .update(teams)
      .set({ totalScore: sql`${teams.totalScore} + ${delta}` })
      .where(eq(teams.id, row.teamId));
  }

  await broadcast(quizChannel(upperCode), PUSHER_EVENTS.scoresUpdated, {
    reason: "host-override",
  });

  return { ok: true };
}

// Manual score correction between rounds. Real trivia nights have
// disputes the auto-grader can't settle (a half-right open answer the
// host accepts verbally, a bonus for the table that got the obscure
// reference). The host adjudicates on the between-rounds leaderboard
// slide; this writes the denormalized team total directly. Bounded to
// ±100 so a fat-finger can't wipe the board, and clamped at 0 so a
// team never shows a negative score.
const MAX_SCORE_DELTA = 100;

// Dedicated result type so the extra "invalidAmount" key stays local to
// this action. Widening the shared HostActionErrorKey would force every
// other host action's consumers (override panel, host controls) to
// handle a key they can never receive.
type AdjustScoreResult =
  | { errorKey: HostActionErrorKey | "invalidAmount" }
  | { ok: true };

export async function adjustTeamScoreAction(
  code: string,
  teamId: string,
  delta: number
): Promise<AdjustScoreResult> {
  const loaded = await loadHostSession(code);
  if ("errorKey" in loaded) return loaded;

  const { session, upperCode } = loaded;

  // Only between rounds — that's when the host reviews the leaderboard
  // and settles disputes. Mid-question editing would race the grader;
  // post-finish editing would rewrite a result players already saw.
  if (session.status !== "between_rounds") {
    return { errorKey: "invalidState" };
  }

  if (
    !Number.isInteger(delta) ||
    delta === 0 ||
    Math.abs(delta) > MAX_SCORE_DELTA
  ) {
    return { errorKey: "invalidAmount" };
  }

  // The team must belong to this session — otherwise a host could move
  // scores in someone else's quiz by guessing team ids.
  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.sessionId, session.id)))
    .limit(1);

  if (!team) {
    return { errorKey: "notFound" };
  }

  await db
    .update(teams)
    .set({
      totalScore: sql`GREATEST(0, ${teams.totalScore} + ${delta})`,
    })
    .where(eq(teams.id, team.id));

  await broadcast(quizChannel(upperCode), PUSHER_EVENTS.scoresUpdated, {
    reason: "host-adjust",
  });

  return { ok: true };
}
