"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { transferCaptainAction } from "../actions";

type Member = {
  id: string;
  userId: string | null;
  name: string;
};

/**
 * Team roster + captain transfer. The sitting captain can pass the role
 * to any teammate while the session is still in the lobby (CLAUDE.md
 * §4.3 captain-only submit — changing it mid-question would race the
 * grader, so the server also enforces lobby-only). Renders the list
 * itself so the badge/“you”/transfer button stay in one place.
 */
export function CaptainControls({
  code,
  teamId,
  members,
  currentUserId,
  captainUserId,
  canManage,
}: {
  code: string;
  teamId: string;
  members: Member[];
  currentUserId: string;
  captainUserId: string | null;
  /** Current user is captain AND the session is still in the lobby. */
  canManage: boolean;
}) {
  const t = useTranslations("PlayLobby");
  const router = useRouter();
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function makeCaptain(targetUserId: string) {
    setErrorKey(null);
    setPendingId(targetUserId);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("teamId", teamId);
      formData.set("targetUserId", targetUserId);
      const result = await transferCaptainAction(code, formData);
      setPendingId(null);
      if ("errorKey" in result) {
        setErrorKey(result.errorKey);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="space-y-2">
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
        {t("membersTitle", { count: members.length })}
      </h2>
      <ul className="space-y-1">
        {members.map((m) => {
          const isCaptain = m.userId === captainUserId;
          const isYou = m.userId === currentUserId;
          const canPromote =
            canManage && m.userId !== null && m.userId !== captainUserId;
          return (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <span className="font-medium">
                {m.name}
                {isYou && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({t("memberYou")})
                  </span>
                )}
              </span>
              <span className="flex items-center gap-2">
                {canPromote && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => makeCaptain(m.userId!)}
                  >
                    {isPending && pendingId === m.userId
                      ? "…"
                      : t("makeCaptain")}
                  </Button>
                )}
                {isCaptain && (
                  <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] uppercase tracking-widest">
                    {t("captainBadge")}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      {errorKey && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {t("captainTransferError")}
        </p>
      )}
    </section>
  );
}
