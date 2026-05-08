"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  ADVANCEMENT_TOP_N_MAX,
  ADVANCEMENT_TOP_N_MIN,
  ROUND_TYPES,
  createRoundSchema,
  type CreateRoundInput,
} from "@/lib/schemas/round";
import { deleteRoundAction, updateRoundAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ValidationKey =
  | "titleMin"
  | "titleMax"
  | "descriptionMax"
  | "advancementTopNMin"
  | "advancementTopNMax";

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

export function EditRoundForm({
  quizId,
  roundId,
  defaultValues,
}: {
  quizId: string;
  roundId: string;
  defaultValues: {
    title: string;
    roundType: (typeof ROUND_TYPES)[number];
    introSlideText: string;
    advancementTopN: number;
  };
}) {
  const t = useTranslations("AdminEditRound");
  const tNew = useTranslations("AdminNewRound");
  const tValidation = useTranslations("Validation");
  const [serverErrorKey, setServerErrorKey] = useState<
    | "unauthorized"
    | "forbidden"
    | "invalidData"
    | "notFound"
    | "generic"
    | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRoundInput>({
    resolver: zodResolver(createRoundSchema),
    defaultValues,
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
      formData.set("advancementTopN", String(data.advancementTopN));
      const result = await updateRoundAction(quizId, roundId, formData);
      if (result?.errorKey) setServerErrorKey(result.errorKey);
    });
  }

  function onDelete() {
    if (!window.confirm(t("deleteConfirm"))) return;
    setServerErrorKey(null);
    startDeleteTransition(async () => {
      const result = await deleteRoundAction(quizId, roundId);
      if (result?.errorKey) setServerErrorKey(result.errorKey);
    });
  }

  const formDisabled = isPending || isDeleting;

  return (
    <div className="space-y-8">
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
          <Label htmlFor="roundType">{tNew("roundTypeLabel")}</Label>
          <select
            id="roundType"
            className={fieldClass}
            {...register("roundType")}
          >
            {ROUND_TYPES.map((value) => (
              <option key={value} value={value}>
                {tNew(`types.${value}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="introSlideText">{tNew("introSlideTextLabel")}</Label>
          <textarea
            id="introSlideText"
            rows={3}
            className={fieldClass}
            {...register("introSlideText")}
          />
          <p className="text-xs text-muted-foreground">
            {tNew("introSlideTextHint")}
          </p>
          {errors.introSlideText?.message && (
            <p className="text-xs text-destructive">
              {tValidation(errors.introSlideText.message as ValidationKey)}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="advancementTopN">
            {tNew("advancementTopNLabel")}
          </Label>
          <Input
            id="advancementTopN"
            type="number"
            min={ADVANCEMENT_TOP_N_MIN}
            max={ADVANCEMENT_TOP_N_MAX}
            {...register("advancementTopN")}
          />
          <p className="text-xs text-muted-foreground">
            {tNew("advancementTopNHint")}
          </p>
          {errors.advancementTopN?.message && (
            <p className="text-xs text-destructive">
              {tValidation(errors.advancementTopN.message as ValidationKey)}
            </p>
          )}
        </div>

        {serverErrorKey && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t(`errors.${serverErrorKey}`)}
          </p>
        )}

        <Button type="submit" size="lg" disabled={formDisabled}>
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </form>

      <div className="space-y-3 border-t border-destructive/30 pt-6">
        <h3 className="font-medium text-destructive">{t("dangerZone")}</h3>
        <p className="text-sm text-muted-foreground">{t("deleteHint")}</p>
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          disabled={formDisabled}
        >
          {isDeleting ? t("deleting") : t("delete")}
        </Button>
      </div>
    </div>
  );
}
