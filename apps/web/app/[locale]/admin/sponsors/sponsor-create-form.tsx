"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  createSponsorSchema,
  type CreateSponsorInput,
} from "@/lib/schemas/sponsor";
import { createSponsorAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ValidationKey =
  | "sponsorNameMin"
  | "sponsorNameMax"
  | "sponsorLogoUrlInvalid"
  | "sponsorLogoUrlMax";

export function SponsorCreateForm() {
  const t = useTranslations("AdminSponsors");
  const tValidation = useTranslations("Validation");
  const [serverErrorKey, setServerErrorKey] = useState<
    "unauthorized" | "forbidden" | "invalidData" | "generic" | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSponsorInput>({
    resolver: zodResolver(createSponsorSchema),
    defaultValues: { name: "", logoUrl: "" },
  });

  function onSubmit(data: CreateSponsorInput) {
    setServerErrorKey(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", data.name);
      if (data.logoUrl) formData.set("logoUrl", data.logoUrl);
      const result = await createSponsorAction(formData);
      if (result?.errorKey) {
        setServerErrorKey(result.errorKey);
      } else {
        reset();
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-md border border-border bg-card px-4 py-5"
    >
      <h2 className="font-heading text-lg uppercase tracking-wider">
        {t("createTitle")}
      </h2>

      <div className="space-y-1.5">
        <Label htmlFor="name">{t("nameLabel")}</Label>
        <Input id="name" {...register("name")} />
        {errors.name?.message && (
          <p className="text-xs text-destructive">
            {tValidation(errors.name.message as ValidationKey)}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="logoUrl">{t("logoUrlLabel")}</Label>
        <Input
          id="logoUrl"
          type="url"
          placeholder="https://example.com/logo.png"
          {...register("logoUrl")}
        />
        <p className="text-xs text-muted-foreground">{t("logoUrlHint")}</p>
        {errors.logoUrl?.message && (
          <p className="text-xs text-destructive">
            {tValidation(errors.logoUrl.message as ValidationKey)}
          </p>
        )}
      </div>

      {serverErrorKey && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t(`errors.${serverErrorKey}`)}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? t("creating") : t("create")}
      </Button>
    </form>
  );
}
