"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
};

type AnswerErrorKey =
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

const TEXT_QUESTION_TYPES: readonly QuestionType[] = [
  "open_text",
  "audio",
  "image_reveal",
];

const DECADE_OPTIONS = Array.from(
  { length: 14 },
  (_, index) => 1900 + index * 10
);

export function QuestionPanel({
  code,
  status,
  question,
  isCaptain,
  hasSubmitted,
  timerEndsAtMs,
  serverNowMs,
}: {
  code: string;
  status: "lobby" | "active" | "reveal" | "paused" | "finished";
  question: LobbyQuestion | null;
  isCaptain: boolean;
  hasSubmitted: boolean;
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

  if (!question || status === "lobby" || status === "paused") {
    return (
      <p className="rounded-md bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground">
        {t("waitingForHost")}
      </p>
    );
  }

  const canSubmit = status === "active" && isCaptain && !hasSubmitted;
  const showTextInput = TEXT_QUESTION_TYPES.includes(question.questionType);

  return (
    <section className="space-y-4 rounded-md border border-border bg-card px-4 py-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <span>
            {status === "active" ? t("activeQuestion") : t("revealQuestion")}
          </span>
          <span>{t("points", { points: question.maxPoints })}</span>
        </div>
        <TimerCountdown
          key={timerEndsAtMs ?? "no-question-timer"}
          active={status === "active"}
          endedLabel={t("timerEnded")}
          endsAtMs={timerEndsAtMs}
          label={t("timerRemaining")}
          serverNowMs={serverNowMs}
        />
        <h2 className="font-heading text-2xl font-black uppercase tracking-wider">
          {question.questionText}
        </h2>
      </div>

      {question.questionType === "multiple_choice" && (
        <div className="grid gap-2">
          {question.options.map((option, index) => (
            <Button
              key={`${question.id}-${option}`}
              type="button"
              variant="outline"
              disabled={!canSubmit || isPending}
              onClick={() => submitMultipleChoice(index)}
              className="h-auto justify-start whitespace-normal py-3 text-left"
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
          />
          <Button type="submit" disabled={!canSubmit || isPending}>
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
                />
              </div>
            ))}
          </div>
          <Button type="submit" disabled={!canSubmit || isPending}>
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
                onChange={(event) => setDecade(event.target.value)}
                disabled={!canSubmit || isPending}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              >
                {DECADE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}s
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="year-answer">{t("yearLabel")}</Label>
              <Input
                id="year-answer"
                type="number"
                inputMode="numeric"
                min={1900}
                max={2030}
                value={year}
                onChange={(event) => setYear(event.target.value)}
                disabled={!canSubmit || isPending}
                autoComplete="off"
              />
            </div>
          </div>
          <Button type="submit" disabled={!canSubmit || isPending}>
            {isPending ? t("submittingAnswer") : t("submitAnswer")}
          </Button>
        </form>
      )}

      {status === "active" && !isCaptain && (
        <p className="text-xs text-muted-foreground">{t("captainOnly")}</p>
      )}
      {status === "active" && hasSubmitted && (
        <p className="text-xs text-muted-foreground">{t("answerSubmitted")}</p>
      )}
      {status === "reveal" && question.correctAnswerLabel && (
        <p className="rounded-md bg-foreground/10 px-3 py-2 text-sm">
          {t("correctAnswer", { answer: question.correctAnswerLabel })}
        </p>
      )}
      {errorKey && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t(`answerErrors.${errorKey}`)}
        </p>
      )}
    </section>
  );
}
