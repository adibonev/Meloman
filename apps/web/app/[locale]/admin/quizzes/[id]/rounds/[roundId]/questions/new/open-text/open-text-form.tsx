"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { createOpenTextQuestionSchema } from "@/lib/schemas/question";
import { createOpenTextQuestionAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpotifySearch } from "@/components/admin/spotify-search";
import type { SpotifyTrack } from "@/lib/spotify";

type ValidationKey =
  | "questionTextMin"
  | "questionTextMax"
  | "answerMin"
  | "answerMax"
  | "answersMin"
  | "answersMax"
  | "timeLimitMin"
  | "timeLimitMax"
  | "pointsMin"
  | "pointsMax";

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

// The form binds `acceptableAnswersText` (a multiline textarea) and converts
// it to `string[]` on submit. Zod still validates against the array schema.
type FormShape = {
  questionText: string;
  acceptableAnswersText: string;
  timeLimitSeconds: number;
  pointsBase: number;
};

export function OpenTextForm({
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
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormShape>({
    // Validate the resolved array through Zod: split textarea -> string[]
    resolver: async (values) => {
      const acceptableAnswers = values.acceptableAnswersText
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const result = createOpenTextQuestionSchema.safeParse({
        questionText: values.questionText,
        acceptableAnswers,
        timeLimitSeconds: values.timeLimitSeconds,
        pointsBase: values.pointsBase,
      });
      if (result.success) return { values, errors: {} };
      // Map Zod error paths back onto the form shape so RHF can show messages.
      const fieldErrors: Record<string, { type: string; message: string }> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        const targetKey = path.startsWith("acceptableAnswers")
          ? "acceptableAnswersText"
          : path;
        if (!fieldErrors[targetKey]) {
          fieldErrors[targetKey] = { type: "validate", message: issue.message };
        }
      }
      return { values: {}, errors: fieldErrors };
    },
    defaultValues: {
      questionText: "",
      acceptableAnswersText: "",
      timeLimitSeconds: 20,
      pointsBase: 1,
    },
  });

  function handleSpotifyPick(track: SpotifyTrack) {
    setValue("questionText", t("spotifyQuestionTemplate", { name: track.name }));
    setValue("acceptableAnswersText", track.artistName);
  }

  function onSubmit(values: FormShape) {
    setServerErrorKey(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("questionText", values.questionText);
      formData.set("acceptableAnswers", values.acceptableAnswersText);
      formData.set("timeLimitSeconds", String(values.timeLimitSeconds));
      formData.set("pointsBase", String(values.pointsBase));
      const result = await createOpenTextQuestionAction(
        quizId,
        roundId,
        formData
      );
      if (result?.errorKey) setServerErrorKey(result.errorKey);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="rounded-md border border-dashed border-border bg-muted/20 p-3">
        <SpotifySearch onSelect={handleSpotifyPick} />
        <p className="mt-1 text-xs text-muted-foreground">
          {t("spotifyHint")}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="questionText">{t("questionTextLabel")}</Label>
        <textarea
          id="questionText"
          rows={3}
          className={fieldClass}
          {...register("questionText")}
        />
        <p className="text-xs text-muted-foreground">
          {t("questionTextEmojiHint")}
        </p>
        {errors.questionText?.message && (
          <p className="text-xs text-destructive">
            {tValidation(errors.questionText.message as ValidationKey)}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="acceptableAnswersText">
          {t("acceptableAnswersLabel")}
        </Label>
        <textarea
          id="acceptableAnswersText"
          rows={5}
          placeholder={t("acceptableAnswersPlaceholder")}
          className={fieldClass}
          {...register("acceptableAnswersText")}
        />
        <p className="text-xs text-muted-foreground">
          {t("acceptableAnswersHint")}
        </p>
        {errors.acceptableAnswersText?.message && (
          <p className="text-xs text-destructive">
            {tValidation(
              errors.acceptableAnswersText.message as ValidationKey
            )}
          </p>
        )}
      </div>

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
          <Label htmlFor="pointsBase">{t("pointsLabel")}</Label>
          <Input
            id="pointsBase"
            type="number"
            min={1}
            max={10}
            {...register("pointsBase")}
          />
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
