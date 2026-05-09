"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  SPONSOR_LOGO_ACCEPTED_MIME_TYPES,
  SPONSOR_LOGO_MAX_SIZE_BYTES,
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

type FileErrorKey = "logoTooLarge" | "logoWrongType" | null;

export function SponsorCreateForm() {
  const t = useTranslations("AdminSponsors");
  const tValidation = useTranslations("Validation");
  const [serverErrorKey, setServerErrorKey] = useState<
    | "unauthorized"
    | "forbidden"
    | "invalidData"
    | "logoTooLarge"
    | "logoWrongType"
    | "logoUploadFailed"
    | "generic"
    | null
  >(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoFileError, setLogoFileError] = useState<FileErrorKey>(null);
  const [isPending, startTransition] = useTransition();

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setLogoFileError(null);
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setLogoFile(null);
      return;
    }
    if (file.size > SPONSOR_LOGO_MAX_SIZE_BYTES) {
      setLogoFileError("logoTooLarge");
      setLogoFile(null);
      event.target.value = "";
      return;
    }
    if (
      !SPONSOR_LOGO_ACCEPTED_MIME_TYPES.includes(
        file.type as (typeof SPONSOR_LOGO_ACCEPTED_MIME_TYPES)[number]
      )
    ) {
      setLogoFileError("logoWrongType");
      setLogoFile(null);
      event.target.value = "";
      return;
    }
    setLogoFile(file);
    setValue("logoUrl", "");
  }

  const {
    register,
    handleSubmit,
    setValue,
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
      if (logoFile) formData.set("logoFile", logoFile);
      const result = await createSponsorAction(formData);
      // The server action redirects on success, so we only see a
      // result here on validation/upload failure. No reset path
      // needed; the redirect blows away this component instance.
      if (result?.errorKey) {
        setServerErrorKey(result.errorKey);
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

      <div className="space-y-1.5">
        <Label htmlFor="logoFile">{t("logoFileLabel")}</Label>
        <input
          id="logoFile"
          type="file"
          accept={SPONSOR_LOGO_ACCEPTED_MIME_TYPES.join(",")}
          onChange={onFileChange}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
        />
        <p className="text-xs text-muted-foreground">{t("logoFileHint")}</p>
        {logoFileError && (
          <p className="text-xs text-destructive">
            {t(`errors.${logoFileError}`)}
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
