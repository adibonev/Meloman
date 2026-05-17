import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import {
  answers,
  gameSessions,
  questions,
  quizzes,
  rounds,
  teamMembers,
  teams,
  users,
} from "@meloman/db/schema";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { getDownloadUrl } from "@/lib/r2";
import { CaptainControls } from "./captain-controls";
import { LiveLobby } from "./live-lobby";
import { QuestionPanel } from "./question-panel";

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function getCorrectAnswerLabel(
  questionType: string,
  correctAnswer: unknown,
  options: string[]
): string | null {
  if (
    questionType === "multiple_choice" &&
    typeof correctAnswer === "number"
  ) {
    return options[correctAnswer] ?? null;
  }
  if (typeof correctAnswer === "string") return correctAnswer;
  if (typeof correctAnswer === "number") return String(correctAnswer);
  if (Array.isArray(correctAnswer)) {
    return correctAnswer
      .filter((item): item is string | number => {
        return typeof item === "string" || typeof item === "number";
      })
      .map(String)
      .join(", ");
  }
  return null;
}

function getBlankCount(questionType: string, correctAnswer: unknown): number {
  if (questionType !== "lyric_blank") return 0;
  return Math.max(1, getStringArray(correctAnswer).length);
}

function getMaxPoints(
  questionType: string,
  pointsBase: number,
  correctAnswer: unknown
): number {
  if (questionType === "lyric_blank") {
    return getBlankCount(questionType, correctAnswer) * pointsBase;
  }
  if (questionType === "decade") return pointsBase * 3;
  return pointsBase;
}

export default async function PlayLobbyPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PlayLobby");

  const upperCode = code.toUpperCase();

  const [session, userSession] = await Promise.all([
    db
      .select({
        id: gameSessions.id,
        status: gameSessions.status,
        quizTitle: quizzes.title,
        currentQuestionId: gameSessions.currentQuestionId,
        questionEndsAt: gameSessions.questionEndsAt,
        serverNowMs:
          sql<number>`(extract(epoch from now()) * 1000)::double precision`.mapWith(
            Number
          ),
      })
      .from(gameSessions)
      .innerJoin(quizzes, eq(quizzes.id, gameSessions.quizId))
      .where(eq(gameSessions.joinCode, upperCode))
      .limit(1),
    auth(),
  ]);

  const row = session[0];
  if (!row) redirect({ href: `/play/${upperCode}`, locale });
  if (!userSession?.user?.id) {
    redirect({ href: `/play/${upperCode}`, locale });
  }
  // narrowing: after the redirect above, both are defined
  const sessionRow = row!;
  const userId = userSession!.user.id!;

  // Find which team in this session the player belongs to.
  const sessionTeams = await db
    .select({
      id: teams.id,
      name: teams.name,
      color: teams.color,
      avatarEmoji: teams.avatarEmoji,
      captainUserId: teams.captainUserId,
      totalScore: teams.totalScore,
      isActive: teams.isActive,
    })
    .from(teams)
    .where(eq(teams.sessionId, sessionRow.id));

  if (sessionTeams.length === 0) {
    redirect({ href: `/play/${upperCode}`, locale });
  }

  const [myMembership] = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.userId, userId),
        inArray(
          teamMembers.teamId,
          sessionTeams.map((tm) => tm.id)
        )
      )
    )
    .limit(1);

  if (!myMembership) {
    redirect({ href: `/play/${upperCode}`, locale });
  }
  const myTeamId = myMembership!.teamId;

  const myTeam = sessionTeams.find((tm) => tm.id === myTeamId)!;
  const isCaptain = myTeam.captainUserId === userId;

  const members = await db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      anonymousName: teamMembers.anonymousName,
      displayName: users.displayName,
    })
    .from(teamMembers)
    .leftJoin(users, eq(users.id, teamMembers.userId))
    .where(eq(teamMembers.teamId, myTeamId))
    .orderBy(asc(teamMembers.joinedAt));

  const [currentQuestion] = sessionRow.currentQuestionId
    ? await db
        .select({
          id: questions.id,
          questionType: questions.questionType,
          questionText: questions.questionText,
          options: questions.options,
          correctAnswer: questions.correctAnswer,
          pointsBase: questions.pointsBase,
          timeLimitSeconds: questions.timeLimitSeconds,
          mediaUrl: questions.mediaUrl,
          mediaAttribution: questions.mediaAttribution,
          mediaBlurPx: questions.mediaBlurPx,
          roundType: rounds.roundType,
        })
        .from(questions)
        .innerJoin(rounds, eq(rounds.id, questions.roundId))
        .where(eq(questions.id, sessionRow.currentQuestionId))
        .limit(1)
    : [];

  const [existingAnswer] =
    sessionRow.currentQuestionId !== null
      ? await db
          .select({
            id: answers.id,
            isCorrect: answers.isCorrect,
            pointsAwarded: answers.pointsAwarded,
            submittedAnswer: answers.submittedAnswer,
          })
          .from(answers)
          .where(
            and(
              eq(answers.teamId, myTeamId),
              eq(answers.questionId, sessionRow.currentQuestionId)
            )
          )
          .limit(1)
      : [];

  const options = getStringArray(currentQuestion?.options);

  // Image-reveal questions get a signed URL so the player phone shows the
  // same blurred photo that the host TV does. Audio is intentionally NOT
  // streamed to phones (CLAUDE.md §4.9: audio plays only on the venue PA so
  // players can't capture and Shazam it).
  let signedImageUrl: string | null = null;
  if (
    currentQuestion?.questionType === "image_reveal" &&
    currentQuestion.mediaUrl
  ) {
    try {
      signedImageUrl = await getDownloadUrl(currentQuestion.mediaUrl);
    } catch (err) {
      console.error("R2 image signed URL failed (player):", err);
    }
  }

  // Player is eliminated iff a per-round cutoff has flipped them to
  // is_active=false. They still see the quiz, just can't submit.
  const isEliminated = !myTeam.isActive;
  // Cutoff has been applied at least once when at least one team is
  // inactive. Used to surface badges only after the first elimination
  // event, not in the default "everyone alive" state.
  const cutoffApplied = sessionTeams.some((tm) => !tm.isActive);
  // Per-round leaderboard for the inter-round slide.
  const playerLeaderboard = sessionTeams.map((tm) => ({
    id: tm.id,
    name: tm.name,
    color: tm.color,
    avatarEmoji: tm.avatarEmoji,
    totalScore: tm.totalScore,
    isActive: tm.isActive,
  }));

  const questionForPanel = currentQuestion
    ? {
        id: currentQuestion.id,
        questionType: currentQuestion.questionType,
        questionText: currentQuestion.questionText,
        options,
        maxPoints: getMaxPoints(
          currentQuestion.questionType,
          currentQuestion.pointsBase,
          currentQuestion.correctAnswer
        ),
        timeLimitSeconds: currentQuestion.timeLimitSeconds,
        correctAnswerLabel: getCorrectAnswerLabel(
          currentQuestion.questionType,
          currentQuestion.correctAnswer,
          options
        ),
        blankCount: getBlankCount(
          currentQuestion.questionType,
          currentQuestion.correctAnswer
        ),
        signedImageUrl,
        mediaBlurPx: currentQuestion.mediaBlurPx ?? null,
        mediaAttribution: currentQuestion.mediaAttribution ?? null,
      }
    : null;
  const questionEndsAtMs = sessionRow.questionEndsAt?.valueOf() ?? null;

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <header className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {t("eyebrow", { code: upperCode })}
        </p>
        <h1 className="font-heading text-4xl font-black uppercase tracking-wider sm:text-5xl">
          {sessionRow.quizTitle}
        </h1>
      </header>

      <section
        className="space-y-3 rounded-lg border border-border bg-card px-6 py-8 text-center"
        style={{ borderTopColor: myTeam.color, borderTopWidth: 4 }}
      >
        <div className="text-6xl">{myTeam.avatarEmoji}</div>
        <p className="font-heading text-3xl font-black uppercase tracking-wider">
          {myTeam.name}
        </p>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {t("yourTeam")}
        </p>
      </section>

      <CaptainControls
        code={upperCode}
        teamId={myTeam.id}
        currentUserId={userId}
        captainUserId={myTeam.captainUserId}
        canManage={isCaptain && sessionRow.status === "lobby"}
        members={members.map((m) => ({
          id: m.id,
          userId: m.userId,
          name: m.displayName ?? m.anonymousName ?? t("memberFallback"),
        }))}
      />

      <QuestionPanel
        key={questionForPanel?.id ?? sessionRow.status}
        code={upperCode}
        status={sessionRow.status}
        question={questionForPanel}
        isCaptain={isCaptain}
        hasSubmitted={existingAnswer !== undefined}
        teamResult={
          existingAnswer
            ? {
                isCorrect: existingAnswer.isCorrect,
                pointsAwarded: existingAnswer.pointsAwarded,
                submittedAnswer: existingAnswer.submittedAnswer,
              }
            : null
        }
        isEliminated={isEliminated}
        cutoffApplied={cutoffApplied}
        leaderboard={playerLeaderboard}
        myTeamId={myTeam.id}
        timerEndsAtMs={questionEndsAtMs}
        serverNowMs={sessionRow.serverNowMs}
      />

      {/* Subscribes to the quiz channel and refreshes the page when the host
          broadcasts a roster change or session-status event. */}
      <LiveLobby code={upperCode} sessionStatus={sessionRow.status} />
    </div>
  );
}
