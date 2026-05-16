import { notFound } from "next/navigation";
import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@meloman/db";
import {
  answers,
  gameSessions,
  questions,
  quizSponsors,
  quizzes,
  rounds,
  sponsors,
  teamMembers,
  teams,
  users,
} from "@meloman/db/schema";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { TimerCountdown } from "@/components/live/timer-countdown";
import { AudioClipPlayer } from "@/components/live/audio-clip-player";
import { BetweenRoundsLeaderboard } from "@/components/live/between-rounds-leaderboard";
import { BlurredImage } from "@/components/live/blurred-image";
import { DecadeYearDisplay } from "@/components/live/decade-year-display";
import { JoinQr } from "@/components/live/join-qr";
import type { LeaderboardTeam } from "@/components/live/leaderboard-overlay";
import { LyricBlankDisplay } from "@/components/live/lyric-blank-display";
import { Podium } from "@/components/live/podium";
import { getDownloadUrl } from "@/lib/r2";
import { getRequestOrigin } from "@/lib/origin";
import { AutoRevealOnTimeout } from "../auto-reveal-on-timeout";
import { LiveHost } from "../live-host";
import { PresentationShell } from "./presentation-shell";

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
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

function getMaxPoints(
  questionType: string,
  pointsBase: number,
  correctAnswer: unknown
): number {
  if (questionType === "lyric_blank") {
    return Math.max(1, getStringArray(correctAnswer).length) * pointsBase;
  }
  if (questionType === "decade") return pointsBase * 3;
  return pointsBase;
}

const MULTIPLE_CHOICE_BADGES = ["A", "B", "C", "D"];

// Fullscreen host presentation. Reuses the same Pusher refresh wiring as the
// host lobby, but renders for a TV: huge typography, no chrome, audio plays
// from R2 signed URLs, image reveal flips blur on/off based on session
// status, leaderboard overlay opens via L (or the corner button).
export default async function HostPresentPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("HostPresent");

  const session = await auth();
  if (!session?.user?.id) notFound();

  const upper = code.toUpperCase();
  const joinUrl = `${await getRequestOrigin()}/play/${upper}`;

  const [row] = await db
    .select({
      sessionId: gameSessions.id,
      quizId: gameSessions.quizId,
      hostId: gameSessions.hostId,
      status: gameSessions.status,
      pausedFromStatus: gameSessions.pausedFromStatus,
      quizTitle: quizzes.title,
      currentQuestionId: gameSessions.currentQuestionId,
      questionEndsAt: gameSessions.questionEndsAt,
      // Legacy single-sponsor fallback. New assignments live in
      // quiz_sponsors so a quiz can show multiple sponsors.
      sponsorName: sponsors.name,
      sponsorLogoUrl: sponsors.logoUrl,
      sponsorLogoR2Key: sponsors.logoR2Key,
      serverNowMs:
        sql<number>`(extract(epoch from now()) * 1000)::double precision`.mapWith(
          Number
        ),
    })
    .from(gameSessions)
    .innerJoin(quizzes, eq(quizzes.id, gameSessions.quizId))
    .leftJoin(sponsors, eq(sponsors.id, quizzes.sponsorId))
    .where(eq(gameSessions.joinCode, upper))
    .limit(1);

  if (!row) notFound();

  const isHost = row.hostId === session.user.id;

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
    .where(eq(teams.sessionId, row.sessionId))
    .orderBy(asc(teams.joinedAt));

  // Member roster — only loaded for the lobby state, where the host TV
  // shows joining teams in real time. After the quiz starts, the
  // presentation focuses on the question and the leaderboard overlay
  // covers the per-team detail.
  const lobbyMembers =
    row.status === "lobby" && sessionTeams.length > 0
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

  const lobbyMembersByTeam = lobbyMembers.reduce<
    Record<string, typeof lobbyMembers>
  >((acc, m) => {
    if (!acc[m.teamId]) acc[m.teamId] = [];
    acc[m.teamId].push(m);
    return acc;
  }, {});

  const leaderboardTeams: LeaderboardTeam[] = sessionTeams.map((team) => ({
    id: team.id,
    name: team.name,
    color: team.color,
    avatarEmoji: team.avatarEmoji,
    totalScore: team.totalScore,
  }));

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
          mediaUrl: questions.mediaUrl,
          mediaAttribution: questions.mediaAttribution,
          mediaBlurPx: questions.mediaBlurPx,
          roundType: rounds.roundType,
          guestVideoUrl: rounds.guestVideoUrl,
        })
        .from(questions)
        .leftJoin(rounds, eq(rounds.id, questions.roundId))
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
  const correctIndex =
    currentQuestion?.questionType === "multiple_choice" &&
    typeof currentQuestion.correctAnswer === "number"
      ? currentQuestion.correctAnswer
      : null;
  const questionEndsAtMs = row.questionEndsAt?.valueOf() ?? null;

  const assignedSponsorRows = await db
    .select({
      id: sponsors.id,
      name: sponsors.name,
      logoUrl: sponsors.logoUrl,
      logoR2Key: sponsors.logoR2Key,
    })
    .from(quizSponsors)
    .innerJoin(sponsors, eq(sponsors.id, quizSponsors.sponsorId))
    .where(eq(quizSponsors.quizId, row.quizId))
    .orderBy(asc(sponsors.name));

  const sponsorRows =
    assignedSponsorRows.length > 0
      ? assignedSponsorRows
      : row.sponsorName
        ? [
            {
              id: row.sponsorLogoR2Key ?? row.sponsorName,
              name: row.sponsorName,
              logoUrl: row.sponsorLogoUrl,
              logoR2Key: row.sponsorLogoR2Key,
            },
          ]
        : [];

  // Sponsor logos: R2 uploads need a fresh signed URL. Failure is
  // non-fatal — each badge falls back to the sponsor name.
  const presentationSponsors = await Promise.all(
    sponsorRows.map(async (sponsor) => {
      let signedLogoUrl: string | null = null;
      if (sponsor.logoR2Key) {
        try {
          signedLogoUrl = await getDownloadUrl(sponsor.logoR2Key);
        } catch (err) {
          console.error("R2 sponsor logo signed URL failed:", err);
        }
      }
      return {
        id: sponsor.id,
        name: sponsor.name,
        logoUrl: signedLogoUrl ?? sponsor.logoUrl ?? null,
      };
    })
  );

  // Generate signed URLs for media-bearing questions. 5-min default expiry
  // is plenty for a 30-sec clip plus reveal time; refresh happens on
  // every status change because the Pusher subscription triggers
  // router.refresh() and the page re-renders.
  let signedAudioUrl: string | null = null;
  let signedImageUrl: string | null = null;
  if (currentQuestion?.mediaUrl) {
    if (currentQuestion.questionType === "audio") {
      try {
        signedAudioUrl = await getDownloadUrl(currentQuestion.mediaUrl);
      } catch (err) {
        console.error("R2 audio signed URL failed:", err);
      }
    }
    if (currentQuestion.questionType === "image_reveal") {
      try {
        signedImageUrl = await getDownloadUrl(currentQuestion.mediaUrl);
      } catch (err) {
        console.error("R2 image signed URL failed:", err);
      }
    }
  }

  // Guest-host final round (CLAUDE.md §3.1): one MP4 per final round the
  // host plays fullscreen before each question. The round (not the
  // question) carries the clip, so this is independent of mediaUrl.
  let signedGuestVideoUrl: string | null = null;
  if (
    currentQuestion?.roundType === "final" &&
    currentQuestion.guestVideoUrl
  ) {
    try {
      signedGuestVideoUrl = await getDownloadUrl(
        currentQuestion.guestVideoUrl
      );
    } catch (err) {
      console.error("R2 guest video signed URL failed:", err);
    }
  }

  return (
    <PresentationShell
      code={upper}
      isHost={isHost}
      status={row.status}
      teams={leaderboardTeams}
      sponsors={presentationSponsors}
      guestVideoUrl={signedGuestVideoUrl}
    >
      <header className="flex items-center justify-between border-b border-border px-8 py-4">
        <div className="space-y-0.5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("eyebrow")}
          </p>
          <h1 className="font-heading text-2xl uppercase tracking-wider">
            {row.quizTitle}
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {t("statusLabel")}
            </p>
            <p className="font-heading text-lg uppercase tracking-wider">
              {t(`status.${row.status}`)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {t("joinCodeLabel")}
            </p>
            <p className="font-heading text-3xl font-black tracking-wider">
              {upper}
            </p>
          </div>
          <Link
            href={`/host/${upper}`}
            className="rounded-md border border-border px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted/30"
          >
            {t("backToLobby")}
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-8 py-12 text-center">
        {row.status === "lobby" && (
          <div className="flex w-full max-w-4xl flex-col items-center gap-6">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              {t("lobbyEyebrow")}
            </p>
            <div className="flex flex-col items-center gap-8 md:flex-row md:gap-12">
              <p className="font-heading text-7xl font-black tracking-wider md:text-8xl">
                {upper}
              </p>
              <div className="flex flex-col items-center gap-3">
                <JoinQr url={joinUrl} size={224} />
                <p className="text-sm uppercase tracking-widest text-muted-foreground">
                  {t("scanToJoin")}
                </p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground">{t("lobbyHint")}</p>
            <p className="font-heading text-3xl uppercase tracking-wider">
              {t("playersValue", {
                players: lobbyMembers.length,
                teams: sessionTeams.length,
              })}
            </p>

            {sessionTeams.length > 0 && (
              <ul className="grid w-full gap-3 text-left md:grid-cols-2">
                {sessionTeams.map((team) => {
                  const members = lobbyMembersByTeam[team.id] ?? [];
                  const captain = members.find(
                    (m) => m.userId === team.captainUserId
                  );
                  const others = members.filter(
                    (m) => m.userId !== team.captainUserId
                  );
                  return (
                    <li
                      key={team.id}
                      className="rounded-md border border-border bg-card px-5 py-4"
                      style={{
                        borderLeftColor: team.color,
                        borderLeftWidth: 6,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span aria-hidden className="text-3xl">
                          {team.avatarEmoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-heading text-xl uppercase tracking-wider">
                            {team.name}
                          </p>
                          {captain && (
                            <p className="truncate text-sm text-muted-foreground">
                              <span className="mr-2 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] uppercase tracking-widest">
                                {t("captainBadge")}
                              </span>
                              {captain.displayName ??
                                captain.anonymousName ??
                                t("memberFallback")}
                            </p>
                          )}
                        </div>
                      </div>
                      {others.length > 0 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {others
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
          </div>
        )}

        {row.status === "finished" && <Podium teams={leaderboardTeams} />}

        {row.status === "between_rounds" && (
          <div className="flex w-full max-w-4xl flex-col items-center gap-8">
            <div className="space-y-2 text-center">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">
                {t("betweenRoundsEyebrow")}
              </p>
              <p className="font-heading text-6xl font-black uppercase tracking-widest md:text-7xl">
                {t("betweenRoundsTitle")}
              </p>
              <p className="text-lg text-muted-foreground">
                {t("betweenRoundsHint")}
              </p>
            </div>
            <BetweenRoundsLeaderboard teams={leaderboardTeams} />
          </div>
        )}

        {row.status === "paused" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <span aria-hidden className="text-8xl leading-none">
              ⏸
            </span>
            <p className="font-heading text-7xl font-black uppercase tracking-widest md:text-8xl">
              {t("pausedBadge")}
            </p>
            <p className="text-lg uppercase tracking-widest text-muted-foreground">
              {t("pausedHint")}
            </p>
          </div>
        )}

        {currentQuestion &&
          (row.status === "active" || row.status === "reveal") && (
            <div className="flex w-full max-w-5xl flex-col items-center gap-8">
              <div className="flex w-full items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>{t(`questionTypes.${currentQuestion.questionType}`)}</span>
                <span>
                  {t("answersValue", {
                    answers: answerCountRow?.value ?? 0,
                    teams: leaderboardTeams.length,
                  })}
                </span>
              </div>

              {currentQuestion.questionType === "lyric_blank" ? (
                <LyricBlankDisplay
                  answerOrderLabel={t("lyricBlankAnswerOrder")}
                  blankCountLabel={t("lyricBlankCount", {
                    count: getStringArray(currentQuestion.correctAnswer).length,
                  })}
                  reveal={row.status === "reveal"}
                  correctWords={getStringArray(currentQuestion.correctAnswer)}
                  perBlankPointsLabel={t("lyricBlankPointsEach", {
                    points: currentQuestion.pointsBase,
                  })}
                  text={currentQuestion.questionText}
                />
              ) : currentQuestion.questionType === "decade" ? (
                <DecadeYearDisplay
                  correctYear={getNumber(currentQuestion.correctAnswer)}
                  decadeLabel={t("decadeCardLabel")}
                  decadePointsLabel={t("decadePoints", {
                    points: currentQuestion.pointsBase,
                  })}
                  exactYearLabel={t("exactYearCardLabel")}
                  exactYearPointsLabel={t("exactYearPoints", {
                    points: currentQuestion.pointsBase * 2,
                  })}
                  promptLabel={t("decadePrompt")}
                  questionText={currentQuestion.questionText}
                  reveal={row.status === "reveal"}
                />
              ) : (
                <h2 className="font-heading text-5xl font-black uppercase tracking-wider md:text-6xl">
                  {currentQuestion.questionText}
                </h2>
              )}

              <p className="text-sm uppercase tracking-widest text-muted-foreground">
                {t("questionMeta", {
                  points: getMaxPoints(
                    currentQuestion.questionType,
                    currentQuestion.pointsBase,
                    currentQuestion.correctAnswer
                  ),
                  seconds: currentQuestion.timeLimitSeconds,
                })}
              </p>

              <TimerCountdown
                key={questionEndsAtMs ?? "no-question-timer"}
                active={row.status === "active"}
                endedLabel={t("timerEnded")}
                endsAtMs={questionEndsAtMs}
                label={t("timerRemaining")}
                serverNowMs={row.serverNowMs}
              />

              {currentQuestion.questionType === "audio" && signedAudioUrl && (
                <div className="flex flex-col items-center gap-4">
                  <div className="font-heading text-2xl uppercase tracking-wider text-muted-foreground">
                    {t("audioListening")}
                  </div>
                  <AudioClipPlayer
                    key={currentQuestion.id}
                    active={row.status === "active"}
                    endsAtMs={questionEndsAtMs}
                    questionId={currentQuestion.id}
                    serverNowMs={row.serverNowMs}
                    signedUrl={signedAudioUrl}
                  />
                </div>
              )}

              {currentQuestion.questionType === "image_reveal" &&
                signedImageUrl && (
                  <BlurredImage
                    alt={currentQuestion.questionText}
                    attribution={currentQuestion.mediaAttribution ?? null}
                    blurPx={currentQuestion.mediaBlurPx ?? null}
                    reveal={row.status === "reveal"}
                    signedUrl={signedImageUrl}
                  />
                )}

              {currentOptions.length > 0 &&
                currentQuestion.questionType === "multiple_choice" && (
                  <ol className="grid w-full max-w-3xl gap-3 md:grid-cols-2">
                    {currentOptions.map((option, index) => {
                      const isCorrect =
                        row.status === "reveal" && correctIndex === index;
                      const isWrong =
                        row.status === "reveal" && correctIndex !== index;
                      return (
                        <li
                          key={`${currentQuestion.id}-${option}`}
                          className="flex items-center gap-3 rounded-md border border-border bg-card px-5 py-4 text-left transition-opacity"
                          style={{
                            opacity: isWrong ? 0.3 : 1,
                            borderColor: isCorrect ? "#fff" : undefined,
                          }}
                        >
                          <span className="font-heading text-2xl font-black tabular-nums">
                            {MULTIPLE_CHOICE_BADGES[index] ?? index + 1}
                          </span>
                          <span className="font-heading text-xl uppercase tracking-wider">
                            {option}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}

              {row.status === "reveal" &&
                correctAnswerLabel &&
                currentQuestion.questionType !== "lyric_blank" &&
                currentQuestion.questionType !== "decade" && (
                  <p className="rounded-md bg-foreground/10 px-6 py-3 font-heading text-3xl uppercase tracking-wider">
                    {t("correctAnswer", { answer: correctAnswerLabel })}
                  </p>
                )}

              {isHost && row.status === "active" && (
                <AutoRevealOnTimeout
                  key={`${currentQuestion.id}-${questionEndsAtMs ?? "no-timer"}`}
                  code={upper}
                  endsAtMs={questionEndsAtMs}
                  questionId={currentQuestion.id}
                  serverNowMs={row.serverNowMs}
                />
              )}
            </div>
          )}
      </main>

      <LiveHost code={upper} />
    </PresentationShell>
  );
}
