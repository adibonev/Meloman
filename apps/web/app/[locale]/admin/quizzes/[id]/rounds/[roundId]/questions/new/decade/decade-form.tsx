"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  DECADE_MAX_YEAR,
  DECADE_MIN_YEAR,
  createDecadeQuestionSchema,
  decadeFromYear,
  type CreateDecadeQuestionInput,
} from "@/lib/schemas/question";
import { createDecadeQuestionAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpotifySearch } from "@/components/admin/spotify-search";
import type { SpotifyTrack } from "@/lib/spotify";

type ValidationKey =
  | "questionTextMin"
  | "questionTextMax"
  | "yearMin"
  | "yearMax"
  | "timeLimitMin"
  | "timeLimitMax"
  | "pointsMin"
  | "pointsMax";

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

export function DecadeForm({
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
    setValue,
    formState: { errors },
  } = useForm<CreateDecadeQuestionInput>({
    resolver: zodResolver(createDecadeQuestionSchema),
    defaultValues: {
      questionText: "",
      correctYear: 1985,
      timeLimitSeconds: 20,
      pointsBase: 1,
    },
  });

  const watchedYear = Number(
    useWatch({ control, name: "correctYear" })
  );
  const watchedPoints =
    Number(useWatch({ control, name: "pointsBase" })) || 1;
  const validYear =
    Number.isInteger(watchedYear) &&
    watchedYear >= DECADE_MIN_YEAR &&
    watchedYear <= DECADE_MAX_YEAR;
  const derivedDecade = validYear ? decadeFromYear(watchedYear) : null;

  function handleSpotifyPick(track: SpotifyTrack) {
    setValue(
      "questionText",
      t("spotifyDecadeQuestionTemplate", {
        name: track.name,
        artist: track.artistName,
      })
    );
    if (track.year !== null) {
      setValue("correctYear", track.year);
    }
  }

  function onSubmit(data: CreateDecadeQuestionInput) {
    setServerErrorKey(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("questionText", data.questionText);
      formData.set("correctYear", String(data.correctYear));
      formData.set("timeLimitSeconds", String(data.timeLimitSeconds));
      formData.set("pointsBase", String(data.pointsBase));
      const result = await createDecadeQuestionAction(
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

      <div className="space-y-1.5">
        <Label htmlFor="correctYear">{t("correctYearLabel")}</Label>
        <Input
          id="correctYear"
          type="number"
          min={DECADE_MIN_YEAR}
          max={DECADE_MAX_YEAR}
          {...register("correctYear")}
        />
        {derivedDecade !== null && (
          <p className="text-xs text-muted-foreground">
            {t("derivedDecade", { decade: derivedDecade })}
          </p>
        )}
        {errors.correctYear?.message && (
          <p className="text-xs text-destructive">
            {tValidation(errors.correctYear.message as ValidationKey)}
          </p>
        )}
      </div>

      <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">{t("scoringTitle")}</p>
        <p>
          {t("scoringDecade", { points: watchedPoints })}
          {" · "}
          {t("scoringYear", { points: watchedPoints * 2 })}
        </p>
        <p className="mt-1">
          {t("scoringMax", { points: watchedPoints * 3 })}
        </p>
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
          <Label htmlFor="pointsBase">{t("pointsBaseLabel")}</Label>
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
