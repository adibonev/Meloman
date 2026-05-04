import { notFound } from "next/navigation";
import { and, asc, count, eq, inArray } from "drizzle-orm";
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
import { LiveHost } from "./live-host";
import { HostControls } from "./host-controls";

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

export default async function HostLobbyPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("HostLobby");

  const session = await auth();
  if (!session?.user?.id) notFound();

  const upper = code.toUpperCase();

  const [row] = await db
    .select({
      sessionId: gameSessions.id,
      hostId: gameSessions.hostId,
      status: gameSessions.status,
      quizTitle: quizzes.title,
      currentQuestionId: gameSessions.currentQuestionId,
    })
    .from(gameSessions)
    .innerJoin(quizzes, eq(quizzes.id, gameSessions.quizId))
    .where(eq(gameSessions.joinCode, upper))
    .limit(1);

  if (!row) notFound();

  const isHost = row.hostId === session.user.id;

  // Roster — load teams + members in two queries; group on the server side
  // so the JSX stays simple.
  const sessionTeams = await db
    .select({
      id: teams.id,
      name: teams.name,
      color: teams.color,
      avatarEmoji: teams.avatarEmoji,
      captainUserId: teams.captainUserId,
      totalScore: teams.totalScore,
    })
    .from(teams)
    .where(eq(teams.sessionId, row.sessionId))
    .orderBy(asc(teams.joinedAt));

  const allMembers =
    sessionTeams.length > 0
      ? await db
          .select({
            id: teamMembers.id,
            teamId: teamMembers.teamId,
            userId: teamMembers.userId,
            anonymousName: teamMembers.anonymousName,
            displayName: users.displayName,
          })
          .from(teamMembers)
          .leftJoin(users, eq(users.id, teamMembers.userId))
          .where(
            inArray(
              teamMembers.teamId,
              sessionTeams.map((tm) => tm.id)
            )
          )
          .orderBy(asc(teamMembers.joinedAt))
      : [];

  const membersByTeam = allMembers.reduce<Record<string, typeof allMembers>>(
    (acc, m) => {
      if (!acc[m.teamId]) acc[m.teamId] = [];
      acc[m.teamId].push(m);
      return acc;
    },
    {}
  );

  const totalPlayers = allMembers.length;

  const [currentQuestion] = row.currentQuestionId
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
        .where(eq(questions.id, row.currentQuestionId))
        .limit(1)
    : [];

  const [answerCountRow] = row.currentQuestionId
    ? await db
        .select({ value: count(answers.id) })
        .from(answers)
        .innerJoin(teams, eq(teams.id, answers.teamId))
        .where(
          and(
            eq(answers.questionId, row.currentQuestionId),
            eq(teams.sessionId, row.sessionId)
          )
        )
    : [{ value: 0 }];

  const currentOptions = getStringArray(currentQuestion?.options);
  const correctAnswerLabel = currentQuestion
    ? getCorrectAnswerLabel(
        currentQuestion.questionType,
        currentQuestion.correctAnswer,
        currentOptions
      )
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h1 className="font-heading text-4xl font-black uppercase tracking-wider">
          {row.quizTitle}
        </h1>
      </header>

      <section className="space-y-2 rounded-md border border-border bg-card px-6 py-8 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {t("joinCodeLabel")}
        </p>
        <p className="font-heading text-6xl font-black tracking-wider">
          {upper}
        </p>
        <p className="text-sm text-muted-foreground">{t("joinHint")}</p>
      </section>

      <section className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1 rounded-md border border-border bg-card px-4 py-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("statusLabel")}
          </p>
          <p className="font-heading text-lg uppercase tracking-wider">
            {t(`status.${row.status}`)}
          </p>
        </div>
        <div className="space-y-1 rounded-md border border-border bg-card px-4 py-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("playersLabel")}
          </p>
          <p className="font-heading text-lg">
            {t("playersValue", {
              players: totalPlayers,
              teams: sessionTeams.length,
            })}
          </p>
        </div>
      </section>

      {isHost ? (
        <HostControls code={upper} status={row.status} />
      ) : (
        <p className="rounded-md bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {t("readOnlyNotice")}
        </p>
      )}

      {currentQuestion && (
        <section className="space-y-4 rounded-md border border-border bg-card px-4 py-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <span>{t("currentQuestionTitle")}</span>
            <span>
              {t("answersValue", {
                answers: answerCountRow?.value ?? 0,
                teams: sessionTeams.length,
              })}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {t(`questionTypes.${currentQuestion.questionType}`)}
            </p>
            <h2 className="font-heading text-2xl font-black uppercase tracking-wider">
              {currentQuestion.questionText}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("questionMeta", {
                points: currentQuestion.pointsBase,
                seconds: currentQuestion.timeLimitSeconds,
              })}
            </p>
          </div>

          {currentOptions.length > 0 && (
            <ol className="grid gap-2 text-sm">
              {currentOptions.map((option, index) => (
                <li
                  key={`${currentQuestion.id}-${option}`}
                  className="rounded-md border border-border px-3 py-2"
                >
                  {index + 1}. {option}
                </li>
              ))}
            </ol>
          )}

          {row.status === "reveal" && correctAnswerLabel && (
            <p className="rounded-md bg-foreground/10 px-3 py-2 text-sm">
              {t("correctAnswer", { answer: correctAnswerLabel })}
            </p>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-heading text-xl uppercase tracking-wider">
          {t("teamsTitle")}
        </h2>
        {sessionTeams.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {t("teamsEmpty")}
          </p>
        ) : (
          <ul className="space-y-2">
            {sessionTeams.map((team) => {
              const members = membersByTeam[team.id] ?? [];
              return (
                <li
                  key={team.id}
                  className="rounded-md border border-border bg-card px-4 py-3"
                  style={{ borderLeftColor: team.color, borderLeftWidth: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex size-10 items-center justify-center rounded-full text-xl"
                      style={{ backgroundColor: team.color + "33" }}
                    >
                      {team.avatarEmoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("teamMemberCount", { count: members.length })} -{" "}
                        {t("teamScore", { score: team.totalScore })}
                      </p>
                    </div>
                  </div>
                  {members.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {members
                        .map(
                          (m) =>
                            m.displayName ??
                            m.anonymousName ??
                            t("memberFallback")
                        )
                        .join(" · ")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <LiveHost code={upper} />
    </div>
  );
}
