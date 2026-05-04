"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { startSessionAction } from "./actions";

export function StartSessionButton({
  quizId,
  canStart,
}: {
  quizId: string;
  canStart: boolean;
}) {
  const t = useTranslations("AdminQuizDetail");
  const [serverErrorKey, setServerErrorKey] = useState<
    | "unauthorized"
    | "forbidden"
    | "notFound"
    | "notPublished"
    | "joinCodeCollision"
    | "generic"
    | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function onStart() {
    setServerErrorKey(null);
    startTransition(async () => {
      const result = await startSessionAction(quizId);
      if (result?.errorKey) setServerErrorKey(result.errorKey);
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="lg"
        onClick={onStart}
        disabled={!canStart || isPending}
      >
        {isPending ? t("startingSession") : t("startSession")}
      </Button>
      {!canStart && (
        <p className="text-xs text-muted-foreground">
          {t("startSessionRequiresPublished")}
        </p>
      )}
      {serverErrorKey && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t(`startSessionErrors.${serverErrorKey}`)}
        </p>
      )}
    </div>
  );
}
