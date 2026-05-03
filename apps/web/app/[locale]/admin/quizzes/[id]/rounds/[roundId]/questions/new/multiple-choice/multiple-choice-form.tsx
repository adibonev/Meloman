"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  MULTIPLE_CHOICE_CORRECT_INDEXES,
  createMultipleChoiceQuestionSchema,
  type CreateMultipleChoiceQuestionInput,
} from "@/lib/schemas/question";
import { createMultipleChoiceQuestionAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpotifySearch } from "@/components/admin/spotify-search";
import type { SpotifyTrack } from "@/lib/spotify";

type ValidationKey =
  | "questionTextMin"
  | "questionTextMax"
  | "optionMin"
  | "optionMax"
  | "correctIndexRange"
  | "timeLimitMin"
  | "timeLimitMax"
  | "pointsMin"
  | "pointsMax";

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

export function MultipleChoiceForm({
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
  } = useForm<CreateMultipleChoiceQuestionInput>({
    resolver: zodResolver(createMultipleChoiceQuestionSchema),
    defaultValues: {
      options: ["", "", "", ""],
      correctIndex: 0,
      timeLimitSeconds: 20,
      pointsBase: 1,
    },
  });

  function handleSpotifyPick(track: SpotifyTrack) {
    // Prefill the question text and Option A with the artist (the most likely
    // correct answer for "Who performs ...?"). The admin can edit anything.
    setValue("questionText", t("spotifyQuestionTemplate", { name: track.name }));
    setValue("options.0", track.artistName);
    setValue("correctIndex", 0);
  }

  function onSubmit(data: CreateMultipleChoiceQuestionInput) {
    setServerErrorKey(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("questionText", data.questionText);
      data.options.forEach((opt, i) => formData.set(`option${i}`, opt));
      formData.set("correctIndex", String(data.correctIndex));
      formData.set("timeLimitSeconds", String(data.timeLimitSeconds));
      formData.set("pointsBase", String(data.pointsBase));
      const result = await createMultipleChoiceQuestionAction(
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
        {errors.questionText?.message && (
          <p className="text-xs text-destructive">
            {tValidation(errors.questionText.message as ValidationKey)}
          </p>
        )}
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium">
          {t("optionsLegend")}
        </legend>
        <p className="text-xs text-muted-foreground">{t("optionsHint")}</p>
        {MULTIPLE_CHOICE_CORRECT_INDEXES.map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex items-center pt-2">
              <input
                type="radio"
                id={`correct-${i}`}
                value={i}
                {...register("correctIndex")}
                className="size-4 cursor-pointer"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label
                htmlFor={`option-${i}`}
                className="text-xs text-muted-foreground"
              >
                {t("optionLabel", { letter: String.fromCharCode(65 + i) })}
              </Label>
              <Input id={`option-${i}`} {...register(`options.${i}` as const)} />
              {errors.options?.[i]?.message && (
                <p className="text-xs text-destructive">
                  {tValidation(errors.options[i]!.message as ValidationKey)}
                </p>
              )}
            </div>
          </div>
        ))}
      </fieldset>

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
