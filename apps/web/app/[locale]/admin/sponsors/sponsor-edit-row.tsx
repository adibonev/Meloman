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
import { deleteSponsorAction, updateSponsorAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ValidationKey =
  | "sponsorNameMin"
  | "sponsorNameMax"
  | "sponsorLogoUrlInvalid"
  | "sponsorLogoUrlMax";

type FileErrorKey = "logoTooLarge" | "logoWrongType" | null;

// Inline edit row for a single sponsor. Always shows an Edit/Cancel
// toggle and a Delete button; when expanded, renders the form below
// the parent row (it has w-full so the flex-wrap parent moves it to
// its own line).
export function SponsorEditRow({
  sponsorId,
  defaultName,
  defaultLogoUrl,
  hasUploadedLogo,
}: {
  sponsorId: string;
  defaultName: string;
  defaultLogoUrl: string;
  // True when the sponsor's logo currently comes from R2 (uploaded)
  // rather than a public URL. Lets us show a "remove uploaded logo"
  // affordance instead of trying to put the R2 key into a URL field.
  hasUploadedLogo: boolean;
}) {
  const t = useTranslations("AdminSponsors");
  const tValidation = useTranslations("Validation");
  const [open, setOpen] = useState(false);
  const [serverErrorKey, setServerErrorKey] = useState<
    | "unauthorized"
    | "forbidden"
    | "invalidData"
    | "notFound"
    | "logoTooLarge"
    | "logoWrongType"
    | "logoUploadFailed"
    | "generic"
    | null
  >(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoFileError, setLogoFileError] = useState<FileErrorKey>(null);
  const [clearLogo, setClearLogo] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateSponsorInput>({
    resolver: zodResolver(createSponsorSchema),
    defaultValues: { name: defaultName, logoUrl: defaultLogoUrl },
  });

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
    // Picking a new file overrides any "clear" intent.
    setClearLogo(false);
  }

  function onSubmit(data: CreateSponsorInput) {
    setServerErrorKey(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", data.name);
      if (data.logoUrl) formData.set("logoUrl", data.logoUrl);
      if (logoFile) formData.set("logoFile", logoFile);
      if (clearLogo) formData.set("clearLogo", "1");
      const result = await updateSponsorAction(sponsorId, formData);
      if (result?.errorKey) setServerErrorKey(result.errorKey);
    });
  }

  function onDelete() {
    if (!window.confirm(t("deleteConfirm", { name: defaultName }))) return;
    setServerErrorKey(null);
    startDeleteTransition(async () => {
      const result = await deleteSponsorAction(sponsorId);
      if (result?.errorKey) setServerErrorKey(result.errorKey);
    });
  }

  const anyPending = isPending || isDeleting;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={open ? "outline" : "ghost"}
          size="sm"
          onClick={() => setOpen((value) => !value)}
          disabled={anyPending}
        >
          {open ? t("cancel") : t("editButton")}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={anyPending}
        >
          {isDeleting ? t("deleting") : t("deleteButton")}
        </Button>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-3 w-full space-y-3 rounded-md border border-border bg-background px-3 py-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor={`name-${sponsorId}`}>{t("nameLabel")}</Label>
            <Input id={`name-${sponsorId}`} {...register("name")} />
            {errors.name?.message && (
              <p className="text-xs text-destructive">
                {tValidation(errors.name.message as ValidationKey)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`logoUrl-${sponsorId}`}>
              {t("logoUrlLabel")}
            </Label>
            <Input
              id={`logoUrl-${sponsorId}`}
              type="url"
              placeholder="https://example.com/logo.png"
              {...register("logoUrl")}
            />
            <p className="text-xs text-muted-foreground">
              {t("logoUrlHintEdit")}
            </p>
            {errors.logoUrl?.message && (
              <p className="text-xs text-destructive">
                {tValidation(errors.logoUrl.message as ValidationKey)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`logoFile-${sponsorId}`}>
              {t("logoFileLabel")}
            </Label>
            <input
              id={`logoFile-${sponsorId}`}
              type="file"
              accept={SPONSOR_LOGO_ACCEPTED_MIME_TYPES.join(",")}
              onChange={onFileChange}
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
            />
            <p className="text-xs text-muted-foreground">
              {t("logoFileHint")}
            </p>
            {logoFileError && (
              <p className="text-xs text-destructive">
                {t(`errors.${logoFileError}`)}
              </p>
            )}
          </div>

          {hasUploadedLogo && (
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={clearLogo}
                onChange={(event) => setClearLogo(event.target.checked)}
              />
              <span>{t("clearLogoLabel")}</span>
            </label>
          )}

          {serverErrorKey && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {t(`errors.${serverErrorKey}`)}
            </p>
          )}

          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? t("saving") : t("save")}
          </Button>
        </form>
      )}
    </>
  );
}
