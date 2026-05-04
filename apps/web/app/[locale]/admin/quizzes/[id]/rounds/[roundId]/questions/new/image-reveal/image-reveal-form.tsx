"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  IMAGE_ACCEPTED_MIME_TYPES,
  IMAGE_MAX_SIZE_BYTES,
  IMAGE_SOURCES,
  IMAGE_SOURCES_REQUIRING_ATTRIBUTION,
  createImageRevealQuestionMetadataSchema,
  type ImageSource,
} from "@/lib/schemas/question";
import { createImageRevealQuestionAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WikipediaSearch } from "@/components/admin/wikipedia-search";
import type { WikipediaResult } from "@/lib/wikipedia";

type ValidationKey =
  | "questionTextMin"
  | "questionTextMax"
  | "answerMin"
  | "answerMax"
  | "answersMin"
  | "answersMax"
  | "attributionRequired"
  | "attributionMax"
  | "timeLimitMin"
  | "timeLimitMax"
  | "pointsMin"
  | "pointsMax";

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

type FormShape = {
  questionText: string;
  acceptableAnswersText: string;
  imageSource: ImageSource;
  imageAttribution: string;
  timeLimitSeconds: number;
  pointsBase: number;
};

export function ImageRevealForm({
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
    | "imageMissing"
    | "imageTooLarge"
    | "imageWrongType"
    | "uploadFailed"
    | "generic"
    | null
  >(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFileError, setImageFileError] = useState<
    "imageMissing" | "imageTooLarge" | "imageWrongType" | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Free the object URL when the preview changes or the form unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const [wikipediaLoading, setWikipediaLoading] = useState(false);
  const [wikipediaError, setWikipediaError] = useState<
    "wikipediaImageFailed" | null
  >(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormShape>({
    resolver: async (values) => {
      const acceptableAnswers = values.acceptableAnswersText
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const result = createImageRevealQuestionMetadataSchema.safeParse({
        questionText: values.questionText,
        acceptableAnswers,
        imageSource: values.imageSource,
        imageAttribution: values.imageAttribution,
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
      imageSource: "Wikipedia",
      imageAttribution: "",
      timeLimitSeconds: 20,
      pointsBase: 1,
    },
  });

  const selectedSource = useWatch({ control, name: "imageSource" });
  const attributionRequired =
    IMAGE_SOURCES_REQUIRING_ATTRIBUTION.includes(selectedSource);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImageFileError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);

    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setImageFile(null);
      return;
    }
    if (file.size > IMAGE_MAX_SIZE_BYTES) {
      setImageFileError("imageTooLarge");
      setImageFile(null);
      e.target.value = "";
      return;
    }
    if (
      !IMAGE_ACCEPTED_MIME_TYPES.includes(
        file.type as (typeof IMAGE_ACCEPTED_MIME_TYPES)[number]
      )
    ) {
      setImageFileError("imageWrongType");
      setImageFile(null);
      e.target.value = "";
      return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleWikipediaPick(result: WikipediaResult) {
    if (!result.thumbnailUrl) {
      setWikipediaError("wikipediaImageFailed");
      return;
    }
    setWikipediaError(null);
    setWikipediaLoading(true);
    setImageFileError(null);

    try {
      // Wikimedia thumbnails support cross-origin GET; this works without
      // a server proxy. If CORS ever blocks us, route through our API.
      const response = await fetch(result.thumbnailUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const mimeType = blob.type || "image/jpeg";
      if (
        !IMAGE_ACCEPTED_MIME_TYPES.includes(
          mimeType as (typeof IMAGE_ACCEPTED_MIME_TYPES)[number]
        )
      ) {
        setWikipediaError("wikipediaImageFailed");
        return;
      }
      const ext = mimeType.split("/")[1] ?? "jpg";
      const safeTitle = result.title
        .replace(/[^a-z0-9]+/gi, "-")
        .toLowerCase()
        .slice(0, 40);
      const file = new File([blob], `wikipedia-${safeTitle}.${ext}`, {
        type: mimeType,
      });

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));

      // Reset the file input so it visually reflects "no file chosen" — the
      // selected file lives in React state regardless.
      if (fileInputRef.current) fileInputRef.current.value = "";

      setValue("imageSource", "Wikipedia");
      setValue("imageAttribution", result.attribution);
    } catch {
      setWikipediaError("wikipediaImageFailed");
    } finally {
      setWikipediaLoading(false);
    }
  }

  function onSubmit(values: FormShape) {
    setServerErrorKey(null);
    if (!imageFile) {
      setImageFileError("imageMissing");
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("questionText", values.questionText);
      formData.set("acceptableAnswers", values.acceptableAnswersText);
      formData.set("imageSource", values.imageSource);
      if (values.imageAttribution) {
        formData.set("imageAttribution", values.imageAttribution);
      }
      formData.set("timeLimitSeconds", String(values.timeLimitSeconds));
      formData.set("pointsBase", String(values.pointsBase));
      formData.set("imageFile", imageFile);
      const result = await createImageRevealQuestionAction(
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
        <WikipediaSearch onSelect={handleWikipediaPick} />
        <p className="mt-1 text-xs text-muted-foreground">
          {t("wikipediaHint")}
        </p>
        {wikipediaLoading && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("wikipediaDownloading")}
          </p>
        )}
        {wikipediaError && (
          <p className="mt-1 text-xs text-destructive">
            {t(`errors.${wikipediaError}`)}
          </p>
        )}
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
        <Label htmlFor="imageFile">{t("imageFileLabel")}</Label>
        <input
          ref={fileInputRef}
          id="imageFile"
          type="file"
          accept={IMAGE_ACCEPTED_MIME_TYPES.join(",")}
          onChange={onFileChange}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
        />
        <p className="text-xs text-muted-foreground">{t("imageFileHint")}</p>
        <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
          {t("copyrightWarning")}
        </p>

        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob URL, intentionally not optimized
          <img
            src={previewUrl}
            alt=""
            className="mt-2 max-h-48 rounded-md border border-border object-contain"
          />
        )}

        {imageFileError && (
          <p className="text-xs text-destructive">
            {t(`errors.${imageFileError}`)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="imageSource">{t("imageSourceLabel")}</Label>
          <select
            id="imageSource"
            className={fieldClass}
            {...register("imageSource")}
          >
            {IMAGE_SOURCES.map((value) => (
              <option key={value} value={value}>
                {t(`imageSources.${value}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="imageAttribution">
            {t("imageAttributionLabel")}
            {attributionRequired && (
              <span className="ml-1 text-destructive">*</span>
            )}
          </Label>
          <Input
            id="imageAttribution"
            placeholder={t("imageAttributionPlaceholder")}
            {...register("imageAttribution")}
          />
          {errors.imageAttribution?.message && (
            <p className="text-xs text-destructive">
              {tValidation(errors.imageAttribution.message as ValidationKey)}
            </p>
          )}
        </div>
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
