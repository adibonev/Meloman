"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { overrideAnswerAction } from "./actions";

type OverrideErrorKey =
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "invalidState"
  | "noQuestions"
  | "noCurrentQuestion"
  | "answerNotFound"
  | "wrongQuestionType"
  | "generic";

export type SubmittedAnswerRow = {
  id: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  teamAvatar: string;
  // The submitted text. For text-answer questions this is always a string;
  // we render `--` if it ever comes through as something else (defensive).
  submittedText: string;
  isCorrect: boolean;
  hostOverride: boolean;
  pointsAwarded: number;
};

// Host-side review panel for open-text answers (open_text / audio /
// image_reveal). Fuzzy match catches close calls but not everything —
// this is where the host accepts a borderline correct answer or rejects
// an accidental hit. Each click toggles the answer, sets host_override,
// and shifts the team's total_score by the delta (server side).
export function AnswerOverridePanel({
  code,
  rows,
}: {
  code: string;
  rows: SubmittedAnswerRow[];
}) {
  const t = useTranslations("HostLobby");
  const router = useRouter();
  const [errorKey, setErrorKey] = useState<OverrideErrorKey | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runOverride(answerId: string, markCorrect: boolean) {
    setErrorKey(null);
    setPendingId(answerId);
    startTransition(async () => {
      const result = await overrideAnswerAction(code, answerId, markCorrect);
      setPendingId(null);
      if ("errorKey" in result) {
        setErrorKey(result.errorKey);
        return;
      }
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        {t("overrideEmpty")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {rows.map((row) => {
          const isThisPending = isPending && pendingId === row.id;
          const targetState = !row.isCorrect;
          return (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-3 rounded-md border bg-card px-4 py-3"
              style={{
                borderColor: row.isCorrect
                  ? "rgb(34 197 94 / 0.6)"
                  : undefined,
                borderLeftColor: row.teamColor,
                borderLeftWidth: 4,
              }}
            >
              <span aria-hidden className="text-2xl">
                {row.teamAvatar}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs uppercase tracking-widest text-muted-foreground">
                  {row.teamName}
                </p>
                <p className="break-words font-medium">{row.submittedText}</p>
                <p className="text-xs text-muted-foreground">
                  {t("overrideStatus", {
                    points: row.pointsAwarded,
                    state: row.isCorrect
                      ? t("overrideStateCorrect")
                      : t("overrideStateWrong"),
                  })}
                  {row.hostOverride && (
                    <span className="ml-2 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] uppercase tracking-widest">
                      {t("overrideManualBadge")}
                    </span>
                  )}
                </p>
              </div>
              <Button
                type="button"
                variant={row.isCorrect ? "destructive" : "default"}
                size="sm"
                disabled={isPending}
                onClick={() => runOverride(row.id, targetState)}
              >
                {isThisPending
                  ? t("working")
                  : targetState
                    ? t("overrideMarkCorrect")
                    : t("overrideMarkWrong")}
              </Button>
            </li>
          );
        })}
      </ul>

      {errorKey && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t(`overrideErrors.${errorKey}`)}
        </p>
      )}
    </div>
  );
}
