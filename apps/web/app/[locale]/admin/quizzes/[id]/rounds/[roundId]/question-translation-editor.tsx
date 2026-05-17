"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateQuestionTranslationsAction } from "./actions";

type Overlay = {
  questionText?: string;
  options?: string[];
  acceptableAnswers?: string[];
};

/**
 * Optional per-question English overlay editor (bilingual quizzes,
 * CLAUDE.md §3). Collapsed by default so it never clutters the
 * authoring flow. Only shows the fields the question type actually has
 * (options for multiple choice, accepted answers for text types).
 */
export function QuestionTranslationEditor({
  quizId,
  roundId,
  questionId,
  baseOptionCount,
  hasAcceptable,
  initial,
}: {
  quizId: string;
  roundId: string;
  questionId: string;
  baseOptionCount: number;
  hasAcceptable: boolean;
  initial: Overlay | null;
}) {
  const t = useTranslations("AdminEditRound");
  const router = useRouter();
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setErrorKey(null);
    startTransition(async () => {
      const result = await updateQuestionTranslationsAction(
        quizId,
        roundId,
        questionId,
        formData
      );
      if (result && "errorKey" in result) {
        setErrorKey(result.errorKey);
        return;
      }
      router.refresh();
    });
  }

  const hasOverlay =
    !!initial &&
    (!!initial.questionText ||
      !!initial.options?.length ||
      !!initial.acceptableAnswers?.length);

  return (
    <details className="border-t border-border px-4 py-3" open={hasOverlay}>
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {t("translationsToggle")}
        {hasOverlay && " ✓"}
      </summary>
      <form action={onSubmit} className="mt-3 space-y-3">
        <p className="text-xs text-muted-foreground">
          {t("translationsHint")}
        </p>

        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">
            {t("questionTextEn")}
          </span>
          <Input
            name="questionTextEn"
            defaultValue={initial?.questionText ?? ""}
          />
        </label>

        {baseOptionCount > 0 &&
          Array.from({ length: baseOptionCount }).map((_, i) => (
            <label key={i} className="block space-y-1">
              <span className="text-xs text-muted-foreground">
                {t("optionEnLabel", { n: i + 1 })}
              </span>
              <Input
                name="optionEn"
                defaultValue={initial?.options?.[i] ?? ""}
              />
            </label>
          ))}

        {hasAcceptable && (
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">
              {t("acceptedEn")}
            </span>
            <textarea
              name="acceptableAnswersEn"
              rows={3}
              defaultValue={(initial?.acceptableAnswers ?? []).join("\n")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        )}

        {errorKey && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {t(`errors.${errorKey}`)}
          </p>
        )}

        <Button type="submit" size="sm" disabled={isPending}>
          {t("saveTranslations")}
        </Button>
      </form>
    </details>
  );
}
