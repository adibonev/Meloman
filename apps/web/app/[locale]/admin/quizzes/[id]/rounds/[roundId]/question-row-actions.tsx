"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  deleteQuestionAction,
  moveQuestionAction,
} from "./actions";

export function QuestionRowActions({
  quizId,
  roundId,
  questionId,
  canMoveUp,
  canMoveDown,
}: {
  quizId: string;
  roundId: string;
  questionId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const t = useTranslations("AdminEditRound");
  const [isPending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      await moveQuestionAction(quizId, roundId, questionId, direction);
    });
  }

  function onDelete() {
    if (!window.confirm(t("deleteQuestionConfirm"))) return;
    startTransition(async () => {
      await deleteQuestionAction(quizId, roundId, questionId);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        aria-label={t("moveQuestionUp")}
        onClick={() => move("up")}
        disabled={!canMoveUp || isPending}
      >
        ↑
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        aria-label={t("moveQuestionDown")}
        onClick={() => move("down")}
        disabled={!canMoveDown || isPending}
      >
        ↓
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="icon-xs"
        aria-label={t("deleteQuestion")}
        onClick={onDelete}
        disabled={isPending}
      >
        ✕
      </Button>
    </div>
  );
}
