"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  type CreateTeamFormInput,
  createTeamFormSchema,
} from "@/lib/schemas/play";
import { createTeamAction, joinTeamAction } from "./actions";
import { getDeviceFingerprint } from "@/lib/device";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TeamRow = {
  id: string;
  name: string;
  color: string;
  avatarEmoji: string;
  memberCount: number;
};

type ServerErrorKey =
  | "unauthorized"
  | "invalidData"
  | "sessionNotFound"
  | "sessionNotJoinable"
  | "teamNotFound"
  | "deviceAlreadyInSession"
  | "generic";

export function TeamSelection({
  code,
  teams,
}: {
  code: string;
  teams: TeamRow[];
}) {
  const t = useTranslations("Play");
  const tValidation = useTranslations("Validation");
  const [serverErrorKey, setServerErrorKey] =
    useState<ServerErrorKey | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTeamFormInput>({
    resolver: zodResolver(createTeamFormSchema),
    defaultValues: { name: "" },
  });

  function onCreate(data: CreateTeamFormInput) {
    const fingerprint = getDeviceFingerprint();
    setServerErrorKey(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", data.name);
      formData.set("deviceFingerprint", fingerprint);
      const result = await createTeamAction(code, formData);
      if (result?.errorKey) setServerErrorKey(result.errorKey);
    });
  }

  function onJoin(teamId: string) {
    const fingerprint = getDeviceFingerprint();
    setServerErrorKey(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("teamId", teamId);
      formData.set("deviceFingerprint", fingerprint);
      const result = await joinTeamAction(code, formData);
      if (result?.errorKey) setServerErrorKey(result.errorKey);
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-heading text-lg uppercase tracking-wider">
          {t("createTeamTitle")}
        </h2>
        <form onSubmit={handleSubmit(onCreate)} noValidate className="space-y-2">
          <Label htmlFor="team-name" className="sr-only">
            {t("teamNameLabel")}
          </Label>
          <Input
            id="team-name"
            placeholder={t("teamNamePlaceholder")}
            autoComplete="off"
            {...register("name")}
          />
          {errors.name?.message && (
            <p className="text-xs text-destructive">
              {tValidation(
                errors.name.message as "teamNameMin" | "teamNameMax"
              )}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            disabled={isPending}
            className="w-full"
          >
            {t("createTeamSubmit")}
          </Button>
        </form>
      </section>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {t("orJoinExisting")}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <section className="space-y-2">
        {teams.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {t("noTeamsYet")}
          </p>
        ) : (
          <ul className="space-y-2">
            {teams.map((team) => (
              <li key={team.id}>
                <button
                  type="button"
                  onClick={() => onJoin(team.id)}
                  disabled={isPending}
                  className="flex w-full items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-left transition-colors hover:border-foreground/30 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span
                    aria-hidden
                    className="flex size-10 items-center justify-center rounded-full text-xl"
                    style={{ backgroundColor: team.color + "33" }}
                  >
                    {team.avatarEmoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {team.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {t("memberCount", { count: team.memberCount })}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {serverErrorKey && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t(`teamErrors.${serverErrorKey}`)}
        </p>
      )}
    </div>
  );
}
