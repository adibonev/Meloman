"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { BlurredImage } from "@/components/live/blurred-image";
import { TimerCountdown } from "@/components/live/timer-countdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitAnswerAction } from "../actions";

type QuestionType =
  | "multiple_choice"
  | "open_text"
  | "audio"
  | "image_reveal"
  | "lyric_blank"
  | "decade";

type LobbyQuestion = {
  id: string;
  questionType: QuestionType;
  questionText: string;
  options: string[];
  maxPoints: number;
  timeLimitSeconds: number;
  correctAnswerLabel: string | null;
  blankCount: number;
  signedImageUrl: string | null;
  mediaBlurPx: number | null;
  mediaAttribution: string | null;
};

type AnswerErrorKey =
  | "unauthorized"
  | "invalidData"
  | "sessionNotFound"
  | "sessionNotJoinable"
  | "teamNotFound"
  | "notCaptain"
  | "eliminated"
  | "questionClosed"
  | "alreadySubmitted"
  | "unsupportedQuestionType"
  | "generic";

const TEXT_QUESTION_TYPES: readonly QuestionType[] = [
  "open_text",
  "audio",
  "image_reveal",
];

const DECADE_OPTIONS = Array.from(
  { length: 14 },
  (_, index) => 1900 + index * 10
);

type LeaderboardEntry = {
  id: string;
  name: string;
  color: string;
  avatarEmoji: string;
  totalScore: number;
  isActive: boolean;
};

export type TeamResult = {
  isCorrect: boolean;
  pointsAwarded: number;
  // The answer the captain submitted, in the same shape the server stored
  // it: number for multiple_choice, string for text-types, string[] for
  // lyric_blank, {decade, year} for decade. Used to render per-type
  // breakdown on reveal.
  submittedAnswer: unknown;
};

function TeamResultBanner({
  question,
  result,
}: {
  question: LobbyQuestion;
  result: TeamResult;
}) {
  const t = useTranslations("PlayLobby");

  // Per-type breakdown of how the team scored. Each branch returns a
  // short helper string the banner shows beneath the headline.
  let breakdown: string | null = null;
  if (question.questionType === "lyric_blank") {
    const blanks = question.blankCount;
    const earned = result.pointsAwarded; // 1 pt × pointsBase per correct blank
    const perBlankPoints = blanks > 0 ? question.maxPoints / blanks : 0;
    const correctBlanks =
      perBlankPoints > 0 ? Math.round(earned / perBlankPoints) : 0;
    breakdown = t("resultLyricBlankBreakdown", {
      correct: correctBlanks,
      total: blanks,
    });
  } else if (question.questionType === "decade") {
    // Decade scoring (CLAUDE.md §3.1 Type 6 / grading.ts):
    //   correctYear  → +pointsBase × 2 + pointsBase = pointsBase × 3
    //   correctDecade only → +pointsBase
    //   neither      → 0
    const base = question.maxPoints / 3;
    const yearCorrect = result.pointsAwarded >= base * 3;
    const decadeCorrect = result.pointsAwarded >= base;
    breakdown = t("resultDecadeBreakdown", {
      decade: decadeCorrect ? "✓" : "✗",
      year: yearCorrect ? "✓" : "✗",
    });
  }

  if (result.isCorrect || result.pointsAwarded > 0) {
    return (
      <div className="space-y-1 rounded-md border border-emerald-400/50 bg-emerald-400/10 px-4 py-3 text-center">
        <p className="font-heading text-lg uppercase tracking-wider text-emerald-300">
          {result.isCorrect
            ? t("resultCorrectHeading")
            : t("resultPartialHeading")}
        </p>
        <p className="text-sm text-emerald-200">
          {t("resultPointsEarned", { points: result.pointsAwarded })}
        </p>
        {breakdown && (
          <p className="text-xs text-emerald-200/80">{breakdown}</p>
        )}
        {question.correctAnswerLabel && (
          <p className="text-xs text-muted-foreground">
            {t("correctAnswer", { answer: question.correctAnswerLabel })}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-center">
      <p className="font-heading text-lg uppercase tracking-wider text-destructive">
        {t("resultWrongHeading")}
      </p>
      {breakdown && (
        <p className="text-xs text-muted-foreground">{breakdown}</p>
      )}
      {question.correctAnswerLabel && (
        <p className="text-sm">
          {t("correctAnswer", { answer: question.correctAnswerLabel })}
        </p>
      )}
    </div>
  );
}

function SubmittedStateBanner({ isCaptain }: { isCaptain: boolean }) {
  const t = useTranslations("PlayLobby");

  return (
    <div className="rounded-md border border-emerald-400/50 bg-emerald-400/10 px-4 py-3 text-center">
      <p className="font-heading text-lg uppercase tracking-wider text-emerald-300">
        {t("answerLockedTitle")}
      </p>
      <p className="mt-1 text-sm text-emerald-200/90">
        {isCaptain
          ? t("answerLockedCaptainBody")
          : t("answerLockedMemberBody")}
      </p>
    </div>
  );
}

function RevealNextHint() {
  const t = useTranslations("PlayLobby");

  return (
    <p className="rounded-md border border-border bg-background/60 px-3 py-2 text-center text-xs uppercase tracking-widest text-muted-foreground">
      {t("nextQuestionComing")}
    </p>
  );
}

function BetweenRoundsPanel({
  cutoffApplied,
  isEliminated,
  leaderboard,
  myTeamId,
}: {
  cutoffApplied: boolean;
  isEliminated: boolean;
  leaderboard: LeaderboardEntry[];
  myTeamId: string;
}) {
  const t = useTranslations("PlayLobby");

  const ranked = [...leaderboard].sort(
    (a, b) => b.totalScore - a.totalScore
  );

  return (
    <section className="space-y-4 rounded-md border border-border bg-card px-4 py-5">
      <div className="space-y-1 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {t("betweenRoundsEyebrow")}
        </p>
        <p className="font-heading text-xl uppercase tracking-wider">
          {t("betweenRoundsTitle")}
        </p>
      </div>

      {cutoffApplied && (
        <p
          className={`rounded-md px-3 py-2 text-center text-sm font-medium ${
            isEliminated
              ? "border border-foreground/40 bg-foreground/10"
              : "border border-amber-400/50 bg-amber-400/10 text-amber-300"
          }`}
        >
          {isEliminated
            ? t("betweenRoundsEliminated")
            : t("betweenRoundsAdvancing")}
        </p>
      )}

      <ol className="space-y-2">
        {ranked.map((team, index) => {
          const isMine = team.id === myTeamId;
          return (
            <li
              key={team.id}
              className="flex items-center gap-3 rounded-md border bg-background px-3 py-2"
              style={{
                borderTopColor: isMine ? team.color : undefined,
                borderRightColor: isMine ? team.color : undefined,
                borderBottomColor: isMine ? team.color : undefined,
                borderLeftColor: team.color,
                borderLeftWidth: 4,
                opacity: cutoffApplied && !team.isActive ? 0.45 : 1,
              }}
            >
              <span className="font-heading w-6 text-sm font-black tabular-nums">
                {index + 1}
              </span>
              <span aria-hidden className="text-xl">
                {team.avatarEmoji}
              </span>
              <span className="flex-1 truncate text-sm font-medium">
                {team.name}
                {isMine && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({t("memberYou")})
                  </span>
                )}
              </span>
              <span className="font-heading text-sm font-black tabular-nums">
                {team.totalScore}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="text-center text-xs text-muted-foreground">
        {t("betweenRoundsHint")}
      </p>
    </section>
  );
}

export function QuestionPanel({
  code,
  status,
  question,
  isCaptain,
  hasSubmitted,
  teamResult,
  isEliminated,
  cutoffApplied,
  leaderboard,
  myTeamId,
  timerEndsAtMs,
  serverNowMs,
}: {
  code: string;
  status:
    | "lobby"
    | "active"
    | "reveal"
    | "between_rounds"
    | "paused"
    | "finished";
  question: LobbyQuestion | null;
  isCaptain: boolean;
  hasSubmitted: boolean;
  teamResult: TeamResult | null;
  isEliminated: boolean;
  cutoffApplied: boolean;
  leaderboard: LeaderboardEntry[];
  myTeamId: string;
  timerEndsAtMs: number | null;
  serverNowMs: number;
}) {
  const t = useTranslations("PlayLobby");
  const router = useRouter();
  const [errorKey, setErrorKey] = useState<AnswerErrorKey | null>(null);
  const [pendingOptionIndex, setPendingOptionIndex] = useState<number | null>(
    null
  );
  const [textAnswer, setTextAnswer] = useState("");
  const [lyricAnswers, setLyricAnswers] = useState<string[]>(
    Array.from({ length: Math.max(1, question?.blankCount ?? 1) }, () => "")
  );
  const [decade, setDecade] = useState("1970");
  const [year, setYear] = useState("");
  const [isPending, startTransition] = useTransition();

  // Year input is constrained to the selected decade. If the captain switches
  // decade after typing a year, we clear the year so they don't submit a
  // self-contradictory guess (e.g. decade 1970 + year 1985).
  const decadeNum = Number(decade);
  const decadeStart = Number.isFinite(decadeNum) ? decadeNum : 1970;
  const decadeEnd = decadeStart + 9;
  const yearNum = Number(year);
  const yearOutsideDecade =
    year !== "" &&
    Number.isFinite(yearNum) &&
    (yearNum < decadeStart || yearNum > decadeEnd);

  function handleDecadeChange(value: string) {
    setDecade(value);
    const nextStart = Number(value);
    const currentYear = Number(year);
    if (
      year !== "" &&
      Number.isFinite(currentYear) &&
      (currentYear < nextStart || currentYear > nextStart + 9)
    ) {
      setYear("");
    }
  }

  function runSubmit(formData: FormData, optionIndex: number | null = null) {
    if (!question) return;
    setErrorKey(null);
    setPendingOptionIndex(optionIndex);
    formData.set("questionType", question.questionType);

    startTransition(async () => {
      const result = await submitAnswerAction(code, formData);
      setPendingOptionIndex(null);
      if ("errorKey" in result && result.errorKey) {
        setErrorKey(result.errorKey);
        return;
      }
      router.refresh();
    });
  }

  function submitMultipleChoice(optionIndex: number) {
    const formData = new FormData();
    formData.set("optionIndex", String(optionIndex));
    runSubmit(formData, optionIndex);
  }

  function submitTextAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("textAnswer", textAnswer);
    runSubmit(formData);
  }

  function submitLyricAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    for (const answer of lyricAnswers) {
      formData.append("lyricAnswers", answer);
    }
    runSubmit(formData);
  }

  function submitDecadeAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("decade", decade);
    formData.set("year", year);
    runSubmit(formData);
  }

  if (status === "finished") {
    return (
      <p className="rounded-md bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground">
        {t("finished")}
      </p>
    );
  }

  if (status === "paused") {
    // Distinct from the lobby copy: at this point the quiz has already
    // started and the captain may have a partial answer typed. Make it
    // clear the host paused on purpose so they don't refresh.
    return (
      <p className="rounded-md border border-foreground/40 bg-foreground/10 px-4 py-3 text-center text-sm font-medium">
        {t("pausedNotice")}
      </p>
    );
  }

  if (status === "between_rounds") {
    return (
      <BetweenRoundsPanel
        cutoffApplied={cutoffApplied}
        isEliminated={isEliminated}
        leaderboard={leaderboard}
        myTeamId={myTeamId}
      />
    );
  }

  if (!question || status === "lobby") {
    return (
      <p className="rounded-md bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground">
        {t("waitingForHost")}
      </p>
    );
  }

  // Eliminated mode: the team didn't make a per-round cutoff. They still
  // see the question shell so they can follow along, but submit is locked.
  if (isEliminated) {
    return (
      <section className="space-y-3 rounded-md border border-foreground/40 bg-foreground/10 px-4 py-5 text-center">
        <p className="font-heading text-xl uppercase tracking-wider">
          {t("eliminatedTitle")}
        </p>
        <p className="text-sm text-muted-foreground">{t("eliminatedBody")}</p>
        {status === "reveal" && question.correctAnswerLabel && (
          <p className="rounded-md bg-foreground/10 px-3 py-2 text-sm">
            {t("correctAnswer", { answer: question.correctAnswerLabel })}
          </p>
        )}
      </section>
    );
  }

  // Reveal-time team result banner — shows correct/wrong + points earned
  // + per-type breakdown. Wraps the rest of the question UI so the
  // result is the first thing the captain sees.
  const showResult = status === "reveal" && teamResult !== null;

  const canSubmit = status === "active" && isCaptain && !hasSubmitted;
  const showTextInput = TEXT_QUESTION_TYPES.includes(question.questionType);

  return (
    <section className="space-y-5 rounded-lg border border-border border-l-2 border-l-primary bg-card px-6 py-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.25em]">
          <span className="text-primary">
            {status === "active" ? t("activeQuestion") : t("revealQuestion")}
          </span>
          <span className="text-muted-foreground">
            {t("points", { points: question.maxPoints })}
          </span>
        </div>
        <TimerCountdown
          key={timerEndsAtMs ?? "no-question-timer"}
          active={status === "active"}
          endedLabel={t("timerEnded")}
          endsAtMs={timerEndsAtMs}
          label={t("timerRemaining")}
          serverNowMs={serverNowMs}
        />
        <h2 className="font-heading text-3xl font-black uppercase tracking-wider sm:text-4xl">
          {question.questionText}
        </h2>
      </div>

      {question.questionType === "image_reveal" && question.signedImageUrl && (
        <BlurredImage
          alt={question.questionText}
          attribution={question.mediaAttribution}
          blurPx={question.mediaBlurPx}
          reveal={status === "reveal"}
          signedUrl={question.signedImageUrl}
        />
      )}

      {question.questionType === "multiple_choice" && (
        <div className="grid gap-3">
          {question.options.map((option, index) => (
            <Button
              key={`${question.id}-${option}`}
              type="button"
              variant="outline"
              disabled={!canSubmit || isPending}
              onClick={() => submitMultipleChoice(index)}
              className="h-auto justify-start whitespace-normal py-4 text-left text-base"
            >
              {isPending && pendingOptionIndex === index
                ? t("submittingAnswer")
                : option}
            </Button>
          ))}
        </div>
      )}

      {showTextInput && (
        <form onSubmit={submitTextAnswer} className="space-y-2">
          <Label htmlFor="text-answer" className="sr-only">
            {t("textAnswerLabel")}
          </Label>
          <Input
            id="text-answer"
            value={textAnswer}
            onChange={(event) => setTextAnswer(event.target.value)}
            placeholder={t("textAnswerPlaceholder")}
            disabled={!canSubmit || isPending}
            autoComplete="off"
            className="h-11 text-base"
          />
          <Button
            type="submit"
            disabled={!canSubmit || isPending}
            className="h-12 w-full text-base"
          >
            {isPending ? t("submittingAnswer") : t("submitAnswer")}
          </Button>
        </form>
      )}

      {question.questionType === "lyric_blank" && (
        <form onSubmit={submitLyricAnswer} className="space-y-3">
          <div className="grid gap-2">
            {lyricAnswers.map((answer, index) => (
              <div key={`${question.id}-blank-${index}`} className="space-y-1">
                <Label htmlFor={`lyric-blank-${index}`}>
                  {t("lyricBlankLabel", { index: index + 1 })}
                </Label>
                <Input
                  id={`lyric-blank-${index}`}
                  value={answer}
                  onChange={(event) => {
                    const next = [...lyricAnswers];
                    next[index] = event.target.value;
                    setLyricAnswers(next);
                  }}
                  disabled={!canSubmit || isPending}
                  autoComplete="off"
                  className="h-11 text-base"
                />
              </div>
            ))}
          </div>
          <Button
            type="submit"
            disabled={!canSubmit || isPending}
            className="h-12 w-full text-base"
          >
            {isPending ? t("submittingAnswer") : t("submitAnswer")}
          </Button>
        </form>
      )}

      {question.questionType === "decade" && (
        <form onSubmit={submitDecadeAnswer} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="decade-answer">{t("decadeLabel")}</Label>
              <select
                id="decade-answer"
                value={decade}
                onChange={(event) => handleDecadeChange(event.target.value)}
                disabled={!canSubmit || isPending}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-base"
              >
                {DECADE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}s
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="year-answer">
                {t("yearLabelWithRange", {
                  start: decadeStart,
                  end: decadeEnd,
                })}
              </Label>
              <Input
                id="year-answer"
                type="number"
                inputMode="numeric"
                min={decadeStart}
                max={decadeEnd}
                value={year}
                onChange={(event) => setYear(event.target.value)}
                disabled={!canSubmit || isPending}
                autoComplete="off"
                className="h-11 text-base"
              />
              {yearOutsideDecade && (
                <p className="text-xs text-destructive">
                  {t("yearOutsideDecadeHint", {
                    start: decadeStart,
                    end: decadeEnd,
                  })}
                </p>
              )}
            </div>
          </div>
          <Button
            type="submit"
            disabled={!canSubmit || isPending || yearOutsideDecade}
            className="h-12 w-full text-base"
          >
            {isPending ? t("submittingAnswer") : t("submitAnswer")}
          </Button>
        </form>
      )}

      {status === "active" && !isCaptain && (
        <p className="text-xs text-muted-foreground">{t("captainOnly")}</p>
      )}
      {status === "active" && hasSubmitted && (
        <SubmittedStateBanner isCaptain={isCaptain} />
      )}
      {showResult && teamResult && (
        <TeamResultBanner question={question} result={teamResult} />
      )}
      {status === "reveal" && !teamResult && question.correctAnswerLabel && (
        <p className="rounded-md bg-foreground/10 px-3 py-2 text-sm">
          {t("correctAnswer", { answer: question.correctAnswerLabel })}
        </p>
      )}
      {status === "reveal" && <RevealNextHint />}
      {errorKey && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t(`answerErrors.${errorKey}`)}
        </p>
      )}
    </section>
  );
}
