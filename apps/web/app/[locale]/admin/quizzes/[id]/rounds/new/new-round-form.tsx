"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  ROUND_TYPES,
  createRoundSchema,
  type CreateRoundInput,
} from "@/lib/schemas/round";
import { createRoundAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ValidationKey = "titleMin" | "titleMax" | "descriptionMax";

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

export function NewRoundForm({ quizId }: { quizId: string }) {
  const t = useTranslations("AdminNewRound");
  const tValidation = useTranslations("Validation");
  const [serverErrorKey, setServerErrorKey] = useState<
    | "unauthorized"
    | "forbidden"
    | "invalidData"
    | "quizNotFound"
    | "generic"
    | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRoundInput>({
    resolver: zodResolver(createRoundSchema),
    defaultValues: {
      roundType: "standard",
    },
  });

  function onSubmit(data: CreateRoundInput) {
    setServerErrorKey(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", data.title);
      formData.set("roundType", data.roundType);
      if (data.introSlideText) {
        formData.set("introSlideText", data.introSlideText);
      }
      const result = await createRoundAction(quizId, formData);
      if (result?.errorKey) setServerErrorKey(result.errorKey);
    });
  }

  return (
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
        <Label htmlFor="roundType">{t("roundTypeLabel")}</Label>
        <select
          id="roundType"
          className={fieldClass}
          {...register("roundType")}
        >
          {ROUND_TYPES.map((value) => (
            <option key={value} value={value}>
              {t(`types.${value}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="introSlideText">{t("introSlideTextLabel")}</Label>
        <textarea
          id="introSlideText"
          rows={3}
          className={fieldClass}
          {...register("introSlideText")}
        />
        <p className="text-xs text-muted-foreground">
          {t("introSlideTextHint")}
        </p>
        {errors.introSlideText?.message && (
          <p className="text-xs text-destructive">
            {tValidation(errors.introSlideText.message as ValidationKey)}
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
