"use client";

import { useTranslations } from "next-intl";
import type { LeaderboardTeam } from "./leaderboard-overlay";
import { rankTeams } from "./podium-rank";

// Inter-round leaderboard slide. Bigger and more presentational than the
// runtime overlay (which is a smaller fullscreen modal) — it's the focus
// of the screen between rounds, not a popup over a question. Teams stay
// in score order so players can see the cutoff line if the host has
// already announced one.
export function BetweenRoundsLeaderboard({
  teams,
}: {
  teams: LeaderboardTeam[];
}) {
  const t = useTranslations("HostPresent");
  const ranked = rankTeams(teams);

  if (ranked.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-6 py-10 text-center text-lg text-muted-foreground">
        {t("leaderboardEmpty")}
      </p>
    );
  }

  return (
    <ol className="w-full space-y-2">
      {ranked.map((team, index) => (
        <li
          key={team.id}
          className="flex items-center gap-5 rounded-md border border-border bg-card px-5 py-4"
          style={{ borderLeftColor: team.color, borderLeftWidth: 6 }}
        >
          <span className="font-heading w-12 text-3xl font-black tabular-nums">
            {index + 1}
          </span>
          <span aria-hidden className="text-3xl">
            {team.avatarEmoji}
          </span>
          <span className="flex-1 truncate font-heading text-2xl uppercase tracking-wider">
            {team.name}
          </span>
          <span className="font-heading text-3xl font-black tabular-nums">
            {team.totalScore}
          </span>
        </li>
      ))}
    </ol>
  );
}
