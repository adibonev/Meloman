"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  joinAsAnonymousSchema,
  type JoinAsAnonymousInput,
} from "@/lib/schemas/play";
import { joinAsAnonymousAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ValidationKey = "displayNameMin" | "displayNameMax";

export function JoinForm({ code }: { code: string }) {
  const t = useTranslations("Play");
  const tValidation = useTranslations("Validation");
  const [serverErrorKey, setServerErrorKey] = useState<
    | "invalidData"
    | "sessionNotFound"
    | "sessionNotJoinable"
    | "generic"
    | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinAsAnonymousInput>({
    resolver: zodResolver(joinAsAnonymousSchema),
    defaultValues: { displayName: "" },
  });

  function onSubmit(data: JoinAsAnonymousInput) {
    setServerErrorKey(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("displayName", data.displayName);
      const result = await joinAsAnonymousAction(code, formData);
      if (result?.errorKey) setServerErrorKey(result.errorKey);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="displayName">{t("displayNameLabel")}</Label>
        <Input
          id="displayName"
          placeholder={t("displayNamePlaceholder")}
          autoComplete="off"
          autoFocus
          {...register("displayName")}
        />
        {errors.displayName?.message && (
          <p className="text-xs text-destructive">
            {tValidation(errors.displayName.message as ValidationKey)}
          </p>
        )}
      </div>

      {serverErrorKey && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t(`errors.${serverErrorKey}`)}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isPending} className="w-full">
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
