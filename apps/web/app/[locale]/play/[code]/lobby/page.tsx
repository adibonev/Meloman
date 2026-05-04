import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import {
  answers,
  gameSessions,
  questions,
  quizzes,
  teamMembers,
  teams,
  users,
} from "@meloman/db/schema";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
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
        })
        .from(questions)
        .where(eq(questions.id, sessionRow.currentQuestionId))
        .limit(1)
    : [];

  const [existingAnswer] =
    sessionRow.currentQuestionId !== null
      ? await db
          .select({ id: answers.id })
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
      }
    : null;
  const questionEndsAtMs = sessionRow.questionEndsAt?.valueOf() ?? null;

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-12">
      <header className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {t("eyebrow", { code: upperCode })}
        </p>
        <h1 className="font-heading text-3xl font-black uppercase tracking-wider">
          {sessionRow.quizTitle}
        </h1>
      </header>

      <section
        className="space-y-2 rounded-md border border-border bg-card px-6 py-6 text-center"
        style={{ borderTopColor: myTeam.color, borderTopWidth: 3 }}
      >
        <div className="text-5xl">{myTeam.avatarEmoji}</div>
        <p className="font-heading text-2xl font-black uppercase tracking-wider">
          {myTeam.name}
        </p>
        <p className="text-xs text-muted-foreground">{t("yourTeam")}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          {t("membersTitle", { count: members.length })}
        </h2>
        <ul className="space-y-1">
          {members.map((m) => {
            const isCaptain = m.userId === myTeam.captainUserId;
            const isYou = m.userId === userId;
            const name =
              m.displayName ?? m.anonymousName ?? t("memberFallback");
            return (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
              >
                <span className="font-medium">
                  {name}
                  {isYou && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({t("memberYou")})
                    </span>
                  )}
                </span>
                {isCaptain && (
                  <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] uppercase tracking-widest">
                    {t("captainBadge")}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <QuestionPanel
        key={questionForPanel?.id ?? sessionRow.status}
        code={upperCode}
        status={sessionRow.status}
        question={questionForPanel}
        isCaptain={isCaptain}
        hasSubmitted={existingAnswer !== undefined}
        timerEndsAtMs={questionEndsAtMs}
        serverNowMs={sessionRow.serverNowMs}
      />

      {/* Subscribes to the quiz channel and refreshes the page when the host
          broadcasts a roster change or session-status event. */}
      <LiveLobby code={upperCode} sessionStatus={sessionRow.status} />
    </div>
  );
}
