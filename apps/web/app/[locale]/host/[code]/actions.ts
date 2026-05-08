"use server";

import { and, asc, eq, sql } from "drizzle-orm";
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

type SessionStatus = "lobby" | "active" | "reveal" | "paused" | "finished";

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

async function loadOrderedQuestions(quizId: string) {
  return db
    .select({
      id: questions.id,
      timeLimitSeconds: questions.timeLimitSeconds,
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
