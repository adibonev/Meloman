"use client";

import { useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  AUDIO_ACCEPTED_MIME_TYPES,
  AUDIO_MAX_DURATION_SECONDS,
  AUDIO_MAX_SIZE_BYTES,
  createAudioQuestionMetadataSchema,
} from "@/lib/schemas/question";
import { createAudioQuestionAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

type FormShape = {
  questionText: string;
  acceptableAnswersText: string;
  timeLimitSeconds: number;
  pointsBase: number;
};

export function AudioForm({
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
    | "audioMissing"
    | "audioTooLarge"
    | "audioWrongType"
    | "uploadFailed"
    | "generic"
    | null
  >(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioFileError, setAudioFileError] = useState<
    "audioMissing" | "audioTooLarge" | "audioWrongType" | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormShape>({
    resolver: async (values) => {
      const acceptableAnswers = values.acceptableAnswersText
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const result = createAudioQuestionMetadataSchema.safeParse({
        questionText: values.questionText,
        acceptableAnswers,
        timeLimitSeconds: values.timeLimitSeconds,
        pointsBase: values.pointsBase,
      });
      if (result.success) return { values, errors: {} };
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
      timeLimitSeconds: 15,
      pointsBase: 1,
    },
  });

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAudioFileError(null);
    setAudioDuration(null);
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setAudioFile(null);
      return;
    }
    if (file.size > AUDIO_MAX_SIZE_BYTES) {
      setAudioFileError("audioTooLarge");
      setAudioFile(null);
      e.target.value = "";
      return;
    }
    if (
      !AUDIO_ACCEPTED_MIME_TYPES.includes(
        file.type as (typeof AUDIO_ACCEPTED_MIME_TYPES)[number]
      )
    ) {
      setAudioFileError("audioWrongType");
      setAudioFile(null);
      e.target.value = "";
      return;
    }
    setAudioFile(file);

    // Best-effort duration probe via HTMLAudioElement. This is informational —
    // the server doesn't trust it; it just shows the admin a soft warning.
    const audio = new Audio(URL.createObjectURL(file));
    audio.addEventListener("loadedmetadata", () => {
      setAudioDuration(audio.duration);
      URL.revokeObjectURL(audio.src);
    });
  }

  function onSubmit(values: FormShape) {
    setServerErrorKey(null);
    if (!audioFile) {
      setAudioFileError("audioMissing");
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("questionText", values.questionText);
      formData.set("acceptableAnswers", values.acceptableAnswersText);
      formData.set("timeLimitSeconds", String(values.timeLimitSeconds));
      formData.set("pointsBase", String(values.pointsBase));
      formData.set("audioFile", audioFile);
      const result = await createAudioQuestionAction(
        quizId,
        roundId,
        formData
      );
      if (result?.errorKey) setServerErrorKey(result.errorKey);
    });
  }

  const watchedTimeLimit = useWatch({ control, name: "timeLimitSeconds" });
  // RHF stores number-typed inputs as either number or string depending on
  // whether the user has typed in the field; coerce to a finite number.
  const timeLimit = Number(watchedTimeLimit);
  const validTimeLimit = Number.isFinite(timeLimit) && timeLimit > 0;

  const overRecommended =
    audioDuration !== null && audioDuration > AUDIO_MAX_DURATION_SECONDS;
  // Round to 1 decimal so the warning reads naturally ("3.4 сек тишина" not
  // "3.4129... сек").
  const fileDurationLabel =
    audioDuration !== null ? audioDuration.toFixed(1) : null;
  const silenceSeconds =
    audioDuration !== null && validTimeLimit && audioDuration < timeLimit
      ? +(timeLimit - audioDuration).toFixed(1)
      : null;
  const cutSeconds =
    audioDuration !== null && validTimeLimit && audioDuration > timeLimit
      ? +(audioDuration - timeLimit).toFixed(1)
      : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
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
        <Label htmlFor="audioFile">{t("audioFileLabel")}</Label>
        <input
          ref={fileInputRef}
          id="audioFile"
          type="file"
          accept={AUDIO_ACCEPTED_MIME_TYPES.join(",")}
          onChange={onFileChange}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
        />
        <p className="text-xs text-muted-foreground">{t("audioFileHint")}</p>

        {audioFile && fileDurationLabel !== null && (
          <p className="text-xs text-muted-foreground">
            {t("audioDuration", {
              seconds: fileDurationLabel,
              max: AUDIO_MAX_DURATION_SECONDS,
            })}
          </p>
        )}

        {overRecommended && (
          <p className="text-xs text-amber-500">
            {t("audioOverRecommended")}
          </p>
        )}

        {silenceSeconds !== null && silenceSeconds > 0 && (
          <p className="text-xs text-amber-500">
            {t("audioSilenceWarning", {
              fileDuration: fileDurationLabel ?? "",
              timeLimit,
              silenceSeconds,
            })}
          </p>
        )}

        {cutSeconds !== null && cutSeconds > 0 && (
          <p className="text-xs text-amber-500">
            {t("audioCutWarning", {
              fileDuration: fileDurationLabel ?? "",
              timeLimit,
              cutSeconds,
            })}
          </p>
        )}

        {audioFileError && (
          <p className="text-xs text-destructive">
            {t(`errors.${audioFileError}`)}
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
        {isPending ? t("uploading") : t("submit")}
      </Button>
    </form>
  );
}
