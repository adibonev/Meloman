"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { moveRoundAction } from "./actions";

export function MoveRoundButtons({
  quizId,
  roundId,
  canMoveUp,
  canMoveDown,
}: {
  quizId: string;
  roundId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const t = useTranslations("AdminQuizDetail");
  const [isPending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      await moveRoundAction(quizId, roundId, direction);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        aria-label={t("moveUp")}
        onClick={() => move("up")}
        disabled={!canMoveUp || isPending}
      >
        ↑
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        aria-label={t("moveDown")}
        onClick={() => move("down")}
        disabled={!canMoveDown || isPending}
      >
        ↓
      </Button>
    </div>
  );
}
