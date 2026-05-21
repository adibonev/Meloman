"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { guestJoinHubAction } from "./actions";

type ServerErrorKey =
  | "invalidData"
  | "sessionNotFound"
  | "sessionNotJoinable"
  | "generic";

// Guest entry on the /play hub: name + code, then anonymous join. Server
// errors reuse the existing Play.errors.* messages; the only hub-local
// message is the client-side "enter a valid code" guard.
export function GuestHubJoin() {
  const t = useTranslations("PlayHub");
  const tPlay = useTranslations("Play");
  const [localError, setLocalError] = useState(false);
  const [serverErrorKey, setServerErrorKey] = useState<ServerErrorKey | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const code = String(fd.get("code") ?? "").trim();
    const name = String(fd.get("displayName") ?? "").trim();
    if (code.length < 4 || name.length < 2) {
      setLocalError(true);
      return;
    }
    setLocalError(false);
    setServerErrorKey(null);
    startTransition(async () => {
      const res = await guestJoinHubAction(fd);
      if (res?.errorKey) setServerErrorKey(res.errorKey);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      <Input
        name="displayName"
        placeholder={t("guestNamePlaceholder")}
        autoComplete="off"
      />
      <Input
        name="code"
        placeholder={t("guestCodePlaceholder")}
        autoComplete="off"
        maxLength={6}
        className="uppercase"
      />
      {localError && (
        <p className="text-xs text-destructive">{t("guestErrorCode")}</p>
      )}
      {serverErrorKey && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {tPlay(`errors.${serverErrorKey}`)}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? tPlay("submitting") : t("guestCta")}
      </Button>
    </form>
  );
}
