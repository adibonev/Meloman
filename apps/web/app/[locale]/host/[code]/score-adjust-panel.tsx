"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { adjustTeamScoreAction } from "./actions";

type ServerErrorKey =
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "invalidState"
  | "noQuestions"
  | "noCurrentQuestion"
  | "answerNotFound"
  | "wrongQuestionType"
  | "invalidAmount"
  | "generic";

type Team = {
  id: string;
  name: string;
  color: string;
  avatarEmoji: string;
  totalScore: number;
};

// Server clamps to ±100; mirror it in the stepper so the preview never
// promises a delta the action would reject.
const MAX_DELTA = 100;

/**
 * Between-rounds manual score correction (host laptop only — never the TV).
 * The host builds a delta with −/+ taps, sees the resulting score, then
 * commits once. Keeps live adjudication fast without a keyboard, and the
 * single Apply means one Pusher broadcast per correction.
 */
export function ScoreAdjustPanel({
  code,
  teams,
}: {
  code: string;
  teams: Team[];
}) {
  const t = useTranslations("HostLobby");
  const router = useRouter();
  const [pending, setPending] = useState<Record<string, number>>({});
  const [serverErrorKey, setServerErrorKey] = useState<ServerErrorKey | null>(
    null
  );
  const [busyTeamId, setBusyTeamId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function bump(teamId: string, by: number) {
    setPending((prev) => {
      const next = Math.max(
        -MAX_DELTA,
        Math.min(MAX_DELTA, (prev[teamId] ?? 0) + by)
      );
      return { ...prev, [teamId]: next };
    });
  }

  function apply(teamId: string) {
    const delta = pending[teamId] ?? 0;
    if (delta === 0) return;
    setServerErrorKey(null);
    setBusyTeamId(teamId);
    startTransition(async () => {
      const result = await adjustTeamScoreAction(code, teamId, delta);
      setBusyTeamId(null);
      if ("errorKey" in result) {
        setServerErrorKey(result.errorKey);
        return;
      }
      setPending((prev) => ({ ...prev, [teamId]: 0 }));
      router.refresh();
    });
  }

  return (
    <section className="space-y-3 rounded-md border border-border bg-card px-4 py-4">
      <div className="space-y-1">
        <h2 className="font-heading text-lg uppercase tracking-wider">
          {t("scoreAdjustTitle")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t("scoreAdjustHint")}
        </p>
      </div>

      <ul className="space-y-2">
        {teams.map((team) => {
          const delta = pending[team.id] ?? 0;
          const preview = Math.max(0, team.totalScore + delta);
          const busy = isPending && busyTeamId === team.id;
          return (
            <li
              key={team.id}
              className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2"
              style={{ borderLeftColor: team.color, borderLeftWidth: 4 }}
            >
              <span aria-hidden className="text-xl">
                {team.avatarEmoji}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {team.name}
              </span>

              <span className="font-heading tabular-nums">
                {delta === 0 ? (
                  team.totalScore
                ) : (
                  <>
                    <span className="text-muted-foreground line-through">
                      {team.totalScore}
                    </span>{" "}
                    <span>{preview}</span>
                  </>
                )}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => bump(team.id, -1)}
                  disabled={isPending}
                  aria-label={t("scoreAdjustMinus")}
                  className="size-8 rounded-md border border-border text-lg leading-none hover:bg-muted/30 disabled:opacity-50"
                >
                  −
                </button>
                <span className="w-10 text-center font-heading tabular-nums">
                  {delta > 0 ? `+${delta}` : delta}
                </span>
                <button
                  type="button"
                  onClick={() => bump(team.id, 1)}
                  disabled={isPending}
                  aria-label={t("scoreAdjustPlus")}
                  className="size-8 rounded-md border border-border text-lg leading-none hover:bg-muted/30 disabled:opacity-50"
                >
                  +
                </button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => apply(team.id)}
                  disabled={delta === 0 || isPending}
                  className="ml-1"
                >
                  {busy ? t("working") : t("scoreAdjustApply")}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {serverErrorKey && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t(`errors.${serverErrorKey}`)}
        </p>
      )}
    </section>
  );
}
