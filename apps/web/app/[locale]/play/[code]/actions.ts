"use server";

import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { db } from "@meloman/db";
import {
  answers,
  gameSessions,
  questions,
  teamMembers,
  teams,
  users,
} from "@meloman/db/schema";
import { auth, signIn } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { broadcast, PUSHER_EVENTS, quizChannel } from "@/lib/pusher-server";
import {
  TEAM_COLORS,
  TEAM_EMOJIS,
  type SubmitAnswerInput,
  createTeamSchema,
  joinAsAnonymousSchema,
  joinTeamSchema,
  submitAnswerSchema,
} from "@/lib/schemas/play";

// Player flow: anonymous user joins a live session. We mint a throwaway
// users row (never reused — random email + random password) and sign the
// browser in via the same Credentials provider the rest of the app uses,
// so role-based queries and `auth()` keep working uniformly.
export async function joinAsAnonymousAction(code: string, formData: FormData) {
  const upperCode = code.toUpperCase();

  const parsed = joinAsAnonymousSchema.safeParse({
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return { errorKey: "invalidData" as const };
  }

  // Make sure the session is real and still accepting players.
  const [row] = await db
    .select({ id: gameSessions.id, status: gameSessions.status })
    .from(gameSessions)
    .where(eq(gameSessions.joinCode, upperCode))
    .limit(1);

  if (!row) {
    return { errorKey: "sessionNotFound" as const };
  }
  if (row.status !== "lobby") {
    return { errorKey: "sessionNotJoinable" as const };
  }

  // Random throwaway credentials. The user can never log back in with these
  // — they only exist to give the JWT something to point at. Sessions are
  // single-browser anyway.
  const anonId = randomUUID();
  const email = `anon-${anonId}@meloman.local`;
  const password = randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    email,
    passwordHash,
    displayName: parsed.data.displayName,
    role: "player",
    emailVerified: false,
  });

  // Auth.js v5 quirk: signIn(..., { redirectTo }) from a Server Action
  // sometimes silently falls back to "/" when the path isn't recognised as
  // a trusted callback. Disabling its redirect and routing through
  // next-intl's locale-aware redirect ourselves makes this deterministic.
  await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  const locale = await getLocale();
  redirect({ href: `/play/${upperCode}`, locale });
}

async function loadJoinableSession(code: string) {
  const upperCode = code.toUpperCase();
  const [session] = await db
    .select({ id: gameSessions.id, status: gameSessions.status })
    .from(gameSessions)
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

export async function createTeamAction(code: string, formData: FormData) {
  const userSession = await auth();
  if (!userSession?.user?.id) {
    return { errorKey: "unauthorized" as const };
  }
  const userId = userSession.user.id;

  const parsed = createTeamSchema.safeParse({
    name: formData.get("name"),
    deviceFingerprint: formData.get("deviceFingerprint"),
  });
  if (!parsed.success) {
    return { errorKey: "invalidData" as const };
  }

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
          eq(teamMembers.deviceFingerprint, parsed.data.deviceFingerprint)
        )
      )
      .limit(1);
    if (clash) {
      return { errorKey: "deviceAlreadyInSession" as const };
    }
  }

  const cosmetics = await pickFreshTeamCosmetics(loaded.session.id);

  const [team] = await db
    .insert(teams)
    .values({
      sessionId: loaded.session.id,
      name: parsed.data.name,
      captainUserId: userId,
      color: cosmetics.color,
      avatarEmoji: cosmetics.emoji,
    })
    .returning({ id: teams.id });

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId,
    deviceFingerprint: parsed.data.deviceFingerprint,
  });

  // Notify the host page so its team list refreshes without a manual reload.
  await broadcast(quizChannel(loaded.upperCode), PUSHER_EVENTS.scoresUpdated, {
    reason: "team-created",
  });

  const locale = await getLocale();
  redirect({ href: `/play/${loaded.upperCode}/lobby`, locale });
}

export async function joinTeamAction(code: string, formData: FormData) {
  const userSession = await auth();
  if (!userSession?.user?.id) {
    return { errorKey: "unauthorized" as const };
  }
  const userId = userSession.user.id;

  const parsed = joinTeamSchema.safeParse({
    teamId: formData.get("teamId"),
    deviceFingerprint: formData.get("deviceFingerprint"),
  });
  if (!parsed.success) {
    return { errorKey: "invalidData" as const };
  }

  const loaded = await loadJoinableSession(code);
  if ("error" in loaded) return { errorKey: loaded.error };

  // Verify the chosen team actually belongs to this session.
  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(
      and(
        eq(teams.id, parsed.data.teamId),
        eq(teams.sessionId, loaded.session.id)
      )
    )
    .limit(1);
  if (!team) return { errorKey: "teamNotFound" as const };

  // Cross-team device check (same as createTeamAction).
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
        eq(teamMembers.deviceFingerprint, parsed.data.deviceFingerprint)
      )
    )
    .limit(1);
  if (clash) {
    return { errorKey: "deviceAlreadyInSession" as const };
  }

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId,
    deviceFingerprint: parsed.data.deviceFingerprint,
  });

  await broadcast(quizChannel(loaded.upperCode), PUSHER_EVENTS.scoresUpdated, {
    reason: "member-joined",
  });

  const locale = await getLocale();
  redirect({ href: `/play/${loaded.upperCode}/lobby`, locale });
}

type SubmitAnswerErrorKey =
  | "unauthorized"
  | "invalidData"
  | "sessionNotFound"
  | "sessionNotJoinable"
  | "teamNotFound"
  | "notCaptain"
  | "questionClosed"
  | "alreadySubmitted"
  | "unsupportedQuestionType"
  | "generic";

type SubmitAnswerResult = { errorKey: SubmitAnswerErrorKey } | { ok: true };

type SubmittedAnswer =
  | number
  | string
  | string[]
  | { decade: number; year: number };

type GradeResult = {
  submittedAnswer: SubmittedAnswer;
  isCorrect: boolean;
  pointsAwarded: number;
};

type QuestionForGrading = {
  id: string;
  questionType:
    | "multiple_choice"
    | "open_text"
    | "audio"
    | "image_reveal"
    | "lyric_blank"
    | "decade";
  correctAnswer: unknown;
  acceptableAnswers: unknown;
  pointsBase: number;
};

function normalizeAnswer(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }
    for (let j = 0; j <= b.length; j++) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function isCloseTextAnswer(submitted: string, accepted: string[]): boolean {
  const normalizedSubmitted = normalizeAnswer(submitted);
  if (!normalizedSubmitted) return false;

  return accepted.some((candidate) => {
    const normalizedCandidate = normalizeAnswer(candidate);
    return (
      normalizedCandidate.length > 0 &&
      (normalizedSubmitted === normalizedCandidate ||
        levenshteinDistance(normalizedSubmitted, normalizedCandidate) <= 2)
    );
  });
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function getAcceptedTextAnswers(question: QuestionForGrading): string[] {
  const accepted = new Set<string>();
  if (typeof question.correctAnswer === "string") {
    accepted.add(question.correctAnswer);
  }
  for (const answer of getStringArray(question.acceptableAnswers)) {
    accepted.add(answer);
  }
  return [...accepted];
}

function decadeFromYear(year: number): number {
  return Math.floor(year / 10) * 10;
}

function gradeAnswer(
  question: QuestionForGrading,
  submitted: SubmitAnswerInput
): GradeResult | null {
  if (question.questionType !== submitted.questionType) {
    return null;
  }

  if (submitted.questionType === "multiple_choice") {
    if (typeof question.correctAnswer !== "number") return null;
    const isCorrect = question.correctAnswer === submitted.optionIndex;
    return {
      submittedAnswer: submitted.optionIndex,
      isCorrect,
      pointsAwarded: isCorrect ? question.pointsBase : 0,
    };
  }

  if (
    submitted.questionType === "open_text" ||
    submitted.questionType === "audio" ||
    submitted.questionType === "image_reveal"
  ) {
    const isCorrect = isCloseTextAnswer(
      submitted.textAnswer,
      getAcceptedTextAnswers(question)
    );
    return {
      submittedAnswer: submitted.textAnswer,
      isCorrect,
      pointsAwarded: isCorrect ? question.pointsBase : 0,
    };
  }

  if (submitted.questionType === "lyric_blank") {
    const correctAnswers = getStringArray(question.correctAnswer);
    if (correctAnswers.length === 0) return null;

    const correctCount = submitted.lyricAnswers.reduce(
      (count, answer, index) => {
        const expected = correctAnswers[index];
        if (!expected) return count;
        return isCloseTextAnswer(answer, [expected]) ? count + 1 : count;
      },
      0
    );

    return {
      submittedAnswer: submitted.lyricAnswers,
      isCorrect:
        correctCount === correctAnswers.length &&
        submitted.lyricAnswers.length === correctAnswers.length,
      pointsAwarded: correctCount * question.pointsBase,
    };
  }

  if (submitted.questionType === "decade") {
    if (typeof question.correctAnswer !== "number") return null;
    const correctDecade = decadeFromYear(question.correctAnswer);
    const yearCorrect = submitted.year === question.correctAnswer;
    const decadeCorrect = yearCorrect || submitted.decade === correctDecade;
    return {
      submittedAnswer: {
        decade: submitted.decade,
        year: submitted.year,
      },
      isCorrect: yearCorrect,
      pointsAwarded:
        (decadeCorrect ? question.pointsBase : 0) +
        (yearCorrect ? question.pointsBase * 2 : 0),
    };
  }

  return null;
}

export async function submitAnswerAction(
  code: string,
  formData: FormData
): Promise<SubmitAnswerResult> {
  const userSession = await auth();
  if (!userSession?.user?.id) {
    return { errorKey: "unauthorized" as const };
  }
  const userId = userSession.user.id;

  const parsed = submitAnswerSchema.safeParse({
    questionType: formData.get("questionType"),
    optionIndex: formData.get("optionIndex"),
    textAnswer: formData.get("textAnswer"),
    lyricAnswers: formData.getAll("lyricAnswers"),
    decade: formData.get("decade"),
    year: formData.get("year"),
  });
  if (!parsed.success) {
    return { errorKey: "invalidData" as const };
  }

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
    return { errorKey: "sessionNotFound" as const };
  }
  if (session.status !== "active" || !session.currentQuestionId) {
    return { errorKey: "sessionNotJoinable" as const };
  }
  if (!session.questionStartedAt || !session.questionEndsAt) {
    return { errorKey: "sessionNotJoinable" as const };
  }

  const nowMs = Date.now();
  if (nowMs > session.questionEndsAt.valueOf()) {
    return { errorKey: "questionClosed" as const };
  }

  const [membership] = await db
    .select({
      teamId: teamMembers.teamId,
      captainUserId: teams.captainUserId,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.teamId))
    .where(
      and(eq(teams.sessionId, session.id), eq(teamMembers.userId, userId))
    )
    .limit(1);

  if (!membership) {
    return { errorKey: "teamNotFound" as const };
  }
  if (membership.captainUserId !== userId) {
    return { errorKey: "notCaptain" as const };
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
    return { errorKey: "unsupportedQuestionType" as const };
  }

  const grade = gradeAnswer(question, parsed.data);
  if (!grade) {
    return { errorKey: "unsupportedQuestionType" as const };
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
    return { errorKey: "alreadySubmitted" as const };
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

  return { ok: true as const };
}
