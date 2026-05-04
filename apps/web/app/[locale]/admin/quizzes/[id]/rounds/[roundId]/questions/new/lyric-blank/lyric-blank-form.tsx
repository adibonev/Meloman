"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  LYRIC_BLANK_MAX_BLANKS,
  LYRIC_BLANK_PLACEHOLDER,
  countLyricBlanks,
  createLyricBlankQuestionSchema,
} from "@/lib/schemas/question";
import { createLyricBlankQuestionAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ValidationKey =
  | "lyricMin"
  | "lyricMax"
  | "answerMin"
  | "answerMax"
  | "answersMinBlank"
  | "answersMaxBlank"
  | "blanksCountMismatch"
  | "timeLimitMin"
  | "timeLimitMax"
  | "pointsMin"
  | "pointsMax";

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

type FormShape = {
  lyricText: string;
  // Sparse array — array length is driven by the lyric blank count, but RHF
  // doesn't know that, so we store as object-like with numeric keys via
  // register("answers.0"), etc.
  answers: string[];
  timeLimitSeconds: number;
  pointsBase: number;
};

export function LyricBlankForm({
  quizId,
  roundId,
}: {
  quizId: string;
  roundId: string;
}) {
  const t = useTranslations("AdminNewQuestion");
  const tValidation = useTranslations("Validation");
  const [serverErrorKey, setServerErrorKey] = useState<
    | "unauthorized"
    | "forbidden"
    | "invalidData"
    | "roundNotFound"
    | "generic"
    | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormShape>({
    resolver: async (values) => {
      const blankCount = countLyricBlanks(values.lyricText ?? "");
      // Trim and clip to the actual number of blanks in the lyric text so
      // stale answers from previous edits don't poison validation.
      const answers = (values.answers ?? [])
        .slice(0, blankCount)
        .map((a) => (a ?? "").trim());

      const result = createLyricBlankQuestionSchema.safeParse({
        lyricText: values.lyricText,
        answers,
        timeLimitSeconds: values.timeLimitSeconds,
        pointsBase: values.pointsBase,
      });
      if (result.success) return { values: { ...values, answers }, errors: {} };

      // RHF expects nested errors: `answers.0` validation error must surface
      // as `errors.answers[0]`, not `errors["answers.0"]`. Without nesting,
      // per-blank error messages would never render.
      const fieldErrors: Record<string, unknown> = {};
      const answerErrors: ({ type: string; message: string } | undefined)[] = [];

      for (const issue of result.error.issues) {
        const segments = issue.path;

        if (
          segments[0] === "answers" &&
          segments.length === 2 &&
          typeof segments[1] === "number"
        ) {
          const idx = segments[1];
          if (!answerErrors[idx]) {
            answerErrors[idx] = {
              type: "validate",
              message: issue.message,
            };
          }
          continue;
        }

        // Array-level answers issue (refine, .min, .max) — surface on
        // lyricText since the admin acts there (adds/removes blanks).
        if (segments.length === 1 && segments[0] === "answers") {
          if (!fieldErrors.lyricText) {
            fieldErrors.lyricText = {
              type: "validate",
              message: issue.message,
            };
          }
          continue;
        }

        const key = String(segments[0]);
        if (!fieldErrors[key]) {
          fieldErrors[key] = { type: "validate", message: issue.message };
        }
      }

      if (answerErrors.length > 0) fieldErrors.answers = answerErrors;
      return { values: {}, errors: fieldErrors };
    },
    defaultValues: {
      lyricText: "",
      answers: [],
      timeLimitSeconds: 30,
      pointsBase: 1,
    },
  });

  const lyricText = useWatch({ control, name: "lyricText" }) ?? "";
  const pointsBase = Number(useWatch({ control, name: "pointsBase" })) || 1;
  const blankCount = countLyricBlanks(lyricText);
  const blankIndexes = Array.from({ length: blankCount });
  const tooManyBlanks = blankCount > LYRIC_BLANK_MAX_BLANKS;

  function onSubmit(values: FormShape) {
    setServerErrorKey(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("lyricText", values.lyricText);
      values.answers.slice(0, blankCount).forEach((answer, i) => {
        formData.set(`answer.${i}`, answer ?? "");
      });
      formData.set("timeLimitSeconds", String(values.timeLimitSeconds));
      formData.set("pointsBase", String(values.pointsBase));
      const result = await createLyricBlankQuestionAction(
        quizId,
        roundId,
        formData
      );
      if (result?.errorKey) setServerErrorKey(result.errorKey);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="lyricText">{t("lyricTextLabel")}</Label>
        <textarea
          id="lyricText"
          rows={5}
          placeholder={t("lyricTextPlaceholder")}
          className={fieldClass}
          {...register("lyricText")}
        />
        <p className="text-xs text-muted-foreground">
          {t("lyricTextHint", { placeholder: LYRIC_BLANK_PLACEHOLDER })}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("blanksCount", { count: blankCount })}
        </p>
        {tooManyBlanks && (
          <p className="text-xs text-amber-500">
            {t("blanksTooMany", { max: LYRIC_BLANK_MAX_BLANKS })}
          </p>
        )}
        {errors.lyricText?.message && (
          <p className="text-xs text-destructive">
            {tValidation(errors.lyricText.message as ValidationKey)}
          </p>
        )}
      </div>

      {blankCount > 0 && !tooManyBlanks && (
        <div className="space-y-3 rounded-md border border-border bg-muted/30 px-4 py-3">
          <p className="text-sm font-medium">{t("answersLegend")}</p>
          <p className="text-xs text-muted-foreground">{t("answersHint")}</p>
          {blankIndexes.map((_, i) => (
            <div key={i} className="space-y-1">
              <Label htmlFor={`answer-${i}`} className="text-xs">
                {t("answerLabel", { number: i + 1 })}
              </Label>
              <Input
                id={`answer-${i}`}
                {...register(`answers.${i}` as const)}
              />
              {errors.answers?.[i]?.message && (
                <p className="text-xs text-destructive">
                  {tValidation(
                    errors.answers[i]!.message as ValidationKey
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="timeLimitSeconds">{t("timeLimitLabel")}</Label>
          <Input
            id="timeLimitSeconds"
            type="number"
            min={5}
            max={120}
            {...register("timeLimitSeconds")}
          />
          {errors.timeLimitSeconds?.message && (
            <p className="text-xs text-destructive">
              {tValidation(errors.timeLimitSeconds.message as ValidationKey)}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pointsBase">{t("pointsPerBlankLabel")}</Label>
          <Input
            id="pointsBase"
            type="number"
            min={1}
            max={10}
            {...register("pointsBase")}
          />
          <p className="text-xs text-muted-foreground">
            {t("pointsPerBlankHint", {
              total: blankCount * pointsBase,
            })}
          </p>
          {errors.pointsBase?.message && (
            <p className="text-xs text-destructive">
              {tValidation(errors.pointsBase.message as ValidationKey)}
            </p>
          )}
        </div>
      </div>

      {serverErrorKey && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t(`errors.${serverErrorKey}`)}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
