"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  MAX_TEAM_SIZE_MAX,
  MAX_TEAM_SIZE_MIN,
  QUIZ_LANGUAGES,
  QUIZ_STATUSES,
  QUIZ_THEMES,
  updateQuizSchema,
  type UpdateQuizInput,
} from "@/lib/schemas/quiz";
import { updateQuizAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ValidationKey =
  | "titleMin"
  | "titleMax"
  | "descriptionMax"
  | "maxTeamSizeMin"
  | "maxTeamSizeMax";

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

export function EditQuizForm({
  quizId,
  defaultValues,
}: {
  quizId: string;
  defaultValues: {
    title: string;
    description: string;
    theme: (typeof QUIZ_THEMES)[number];
    language: (typeof QUIZ_LANGUAGES)[number];
    status: (typeof QUIZ_STATUSES)[number];
    maxTeamSize: number;
  };
}) {
  const t = useTranslations("AdminQuizDetail");
  const tNew = useTranslations("AdminNewQuiz");
  const tValidation = useTranslations("Validation");
  const [serverErrorKey, setServerErrorKey] = useState<
    "unauthorized" | "forbidden" | "invalidData" | "notFound" | "generic" | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateQuizInput>({
    resolver: zodResolver(updateQuizSchema),
    defaultValues,
  });

  function onSubmit(data: UpdateQuizInput) {
    setServerErrorKey(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", data.title);
      if (data.description) formData.set("description", data.description);
      formData.set("theme", data.theme);
      formData.set("language", data.language);
      formData.set("status", data.status);
      formData.set("maxTeamSize", String(data.maxTeamSize));
      const result = await updateQuizAction(quizId, formData);
      if (result?.errorKey) setServerErrorKey(result.errorKey);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">{tNew("titleLabel")}</Label>
        <Input id="title" {...register("title")} />
        {errors.title?.message && (
          <p className="text-xs text-destructive">
            {tValidation(errors.title.message as ValidationKey)}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">{tNew("descriptionLabel")}</Label>
        <textarea
          id="description"
          rows={4}
          className={fieldClass}
          {...register("description")}
        />
        {errors.description?.message && (
          <p className="text-xs text-destructive">
            {tValidation(errors.description.message as ValidationKey)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="theme">{tNew("themeLabel")}</Label>
          <select id="theme" className={fieldClass} {...register("theme")}>
            {QUIZ_THEMES.map((value) => (
              <option key={value} value={value}>
                {tNew(`themes.${value}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="language">{tNew("languageLabel")}</Label>
          <select
            id="language"
            className={fieldClass}
            {...register("language")}
          >
            {QUIZ_LANGUAGES.map((value) => (
              <option key={value} value={value}>
                {tNew(`languages.${value}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">{t("statusLabel")}</Label>
          <select id="status" className={fieldClass} {...register("status")}>
            {QUIZ_STATUSES.map((value) => (
              <option key={value} value={value}>
                {t(`statuses.${value}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="maxTeamSize">{t("maxTeamSizeLabel")}</Label>
        <Input
          id="maxTeamSize"
          type="number"
          min={MAX_TEAM_SIZE_MIN}
          max={MAX_TEAM_SIZE_MAX}
          {...register("maxTeamSize")}
        />
        <p className="text-xs text-muted-foreground">
          {t("maxTeamSizeHint")}
        </p>
        {errors.maxTeamSize?.message && (
          <p className="text-xs text-destructive">
            {tValidation(errors.maxTeamSize.message as ValidationKey)}
          </p>
        )}
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
