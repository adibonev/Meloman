"use server";

import { asc, eq } from "drizzle-orm";
import { db } from "@meloman/db";
import { gameSessions, questions, rounds } from "@meloman/db/schema";
import { auth } from "@/auth";
import { broadcast, PUSHER_EVENTS, quizChannel } from "@/lib/pusher-server";

type HostActionErrorKey =
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "invalidState"
  | "noQuestions"
  | "noCurrentQuestion"
  | "generic";

type HostActionResult = { errorKey: HostActionErrorKey } | { ok: true };

type HostSessionRow = {
  id: string;
  hostId: string;
  status: "lobby" | "active" | "reveal" | "paused" | "finished";
  quizId: string;
  currentQuestionId: string | null;
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
