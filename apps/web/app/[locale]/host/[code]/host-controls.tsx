"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  nextQuestionAction,
  pauseSessionAction,
  resumeSessionAction,
  revealAnswerAction,
  startQuizAction,
} from "./actions";

type SessionStatus = "lobby" | "active" | "reveal" | "paused" | "finished";

type ServerErrorKey =
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "invalidState"
  | "noQuestions"
  | "noCurrentQuestion"
  | "answerNotFound"
  | "wrongQuestionType"
  | "generic";

type HostActionClientResult = { errorKey: ServerErrorKey } | { ok: true };

export function HostControls({
  code,
  status,
}: {
  code: string;
  status: SessionStatus;
}) {
  const t = useTranslations("HostLobby");
  const router = useRouter();
  const [serverErrorKey, setServerErrorKey] = useState<ServerErrorKey | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  function runAction(action: () => Promise<HostActionClientResult>) {
    setServerErrorKey(null);
    startTransition(async () => {
      const result = await action();
      if ("errorKey" in result) {
        setServerErrorKey(result.errorKey);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="space-y-3 rounded-md border border-border bg-card px-4 py-4">
      <div className="space-y-1">
        <h2 className="font-heading text-lg uppercase tracking-wider">
          {t("controlsTitle")}
        </h2>
        <p className="text-xs text-muted-foreground">{t("controlsHint")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {status === "lobby" && (
          <Button
            type="button"
            onClick={() => runAction(() => startQuizAction(code))}
            disabled={isPending}
          >
            {isPending ? t("working") : t("startQuiz")}
          </Button>
        )}
        {status === "active" && (
          <Button
            type="button"
            onClick={() => runAction(() => revealAnswerAction(code))}
            disabled={isPending}
          >
            {isPending ? t("working") : t("revealAnswer")}
          </Button>
        )}
        {status === "reveal" && (
          <Button
            type="button"
            onClick={() => runAction(() => nextQuestionAction(code))}
            disabled={isPending}
          >
            {isPending ? t("working") : t("nextQuestion")}
          </Button>
        )}
        {(status === "active" || status === "reveal") && (
          <Button
            type="button"
            variant="outline"
            onClick={() => runAction(() => pauseSessionAction(code))}
            disabled={isPending}
          >
            {isPending ? t("working") : t("pauseSession")}
          </Button>
        )}
        {status === "paused" && (
          <Button
            type="button"
            onClick={() => runAction(() => resumeSessionAction(code))}
            disabled={isPending}
          >
            {isPending ? t("working") : t("resumeSession")}
          </Button>
        )}
        {status === "finished" && (
          <p className="text-sm text-muted-foreground">
            {t("sessionFinished")}
          </p>
        )}
      </div>

      {serverErrorKey && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t(`errors.${serverErrorKey}`)}
        </p>
      )}
    </section>
  );
}
