"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  createQuizSchema,
  QUIZ_LANGUAGES,
  QUIZ_THEMES,
  type CreateQuizInput,
} from "@/lib/schemas/quiz";
import { createQuizAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ValidationKey =
  | "titleMin"
  | "titleMax"
  | "descriptionMax";

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

export default function NewQuizPage() {
  const t = useTranslations("AdminNewQuiz");
  const tValidation = useTranslations("Validation");
  const [serverErrorKey, setServerErrorKey] = useState<
    "unauthorized" | "forbidden" | "invalidData" | "generic" | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateQuizInput>({
    resolver: zodResolver(createQuizSchema),
    defaultValues: {
      theme: "modern",
      language: "bg",
    },
  });

  function onSubmit(data: CreateQuizInput) {
    setServerErrorKey(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", data.title);
      if (data.description) formData.set("description", data.description);
      formData.set("theme", data.theme);
      formData.set("language", data.language);
      const result = await createQuizAction(formData);
      if (result?.errorKey) setServerErrorKey(result.errorKey);
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-black tracking-wider uppercase">
          {t("title")}
        </h1>
        <Link
          href="/admin/quizzes"
          className="text-sm text-muted-foreground hover:underline"
        >
          {t("backToList")}
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">{t("titleLabel")}</Label>
          <Input id="title" {...register("title")} />
          {errors.title?.message && (
            <p className="text-xs text-destructive">
              {tValidation(errors.title.message as ValidationKey)}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">{t("descriptionLabel")}</Label>
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="theme">{t("themeLabel")}</Label>
            <select id="theme" className={fieldClass} {...register("theme")}>
              {QUIZ_THEMES.map((value) => (
                <option key={value} value={value}>
                  {t(`themes.${value}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="language">{t("languageLabel")}</Label>
            <select
              id="language"
              className={fieldClass}
              {...register("language")}
            >
              {QUIZ_LANGUAGES.map((value) => (
                <option key={value} value={value}>
                  {t(`languages.${value}`)}
                </option>
              ))}
            </select>
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
    </div>
  );
}
