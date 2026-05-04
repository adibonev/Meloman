"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { submitMultipleChoiceAnswerAction } from "../actions";

type LobbyQuestion = {
  id: string;
  questionType: string;
  questionText: string;
  options: string[];
  pointsBase: number;
  timeLimitSeconds: number;
  correctAnswerLabel: string | null;
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

export function QuestionPanel({
  code,
  status,
  question,
  isCaptain,
  hasSubmitted,
}: {
  code: string;
  status: "lobby" | "active" | "reveal" | "paused" | "finished";
  question: LobbyQuestion | null;
  isCaptain: boolean;
  hasSubmitted: boolean;
}) {
  const t = useTranslations("PlayLobby");
  const router = useRouter();
  const [errorKey, setErrorKey] = useState<AnswerErrorKey | null>(null);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(optionIndex: number) {
    setErrorKey(null);
    setPendingIndex(optionIndex);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("optionIndex", String(optionIndex));
      const result = await submitMultipleChoiceAnswerAction(code, formData);
      setPendingIndex(null);
      if ("errorKey" in result && result.errorKey) {
        setErrorKey(result.errorKey);
        return;
      }
      router.refresh();
    });
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

  const isMultipleChoice = question.questionType === "multiple_choice";
  const canSubmit =
    status === "active" && isMultipleChoice && isCaptain && !hasSubmitted;

  return (
    <section className="space-y-4 rounded-md border border-border bg-card px-4 py-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <span>
            {status === "active" ? t("activeQuestion") : t("revealQuestion")}
          </span>
          <span>{t("points", { points: question.pointsBase })}</span>
        </div>
        <h2 className="font-heading text-2xl font-black uppercase tracking-wider">
          {question.questionText}
        </h2>
      </div>

      {isMultipleChoice ? (
        <div className="grid gap-2">
          {question.options.map((option, index) => (
            <Button
              key={`${question.id}-${option}`}
              type="button"
              variant="outline"
              disabled={!canSubmit || isPending}
              onClick={() => submit(index)}
              className="h-auto justify-start whitespace-normal py-3 text-left"
            >
              {isPending && pendingIndex === index
                ? t("submittingAnswer")
                : option}
            </Button>
          ))}
        </div>
      ) : (
        <p className="rounded-md bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {t("unsupportedQuestionType")}
        </p>
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
