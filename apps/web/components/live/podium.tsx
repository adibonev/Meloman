"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { LeaderboardTeam } from "./leaderboard-overlay";
import { rankTeams } from "./podium-rank";

// Reveal builds to the climax: bronze first, then silver, then gold last.
// Restraint over spectacle (CLAUDE.md §9.1) — a short rise + fade.
const PODIUM_RISE_DELAY: Record<1 | 2 | 3, number> = {
  3: 0.15,
  2: 0.45,
  1: 0.8,
};

// Podium order is 2nd / 1st / 3rd visually so the gold spot stands in the
// middle. We keep the underlying ranking array sorted by score (desc), and
// pluck the top 3 in that intentional layout order.
const PODIUM_LAYOUT: ReadonlyArray<{ rank: 1 | 2 | 3; heightClass: string }> = [
  { rank: 2, heightClass: "h-44" },
  { rank: 1, heightClass: "h-60" },
  { rank: 3, heightClass: "h-32" },
];

const PODIUM_COLORS: Record<1 | 2 | 3, string> = {
  1: "#facc15", // gold
  2: "#cbd5e1", // silver
  3: "#d97706", // bronze
};

export function Podium({ teams }: { teams: LeaderboardTeam[] }) {
  const t = useTranslations("HostPresent");
  const ranked = rankTeams(teams);

  if (ranked.length === 0) {
    return (
      <div className="space-y-4 text-center">
        <p className="font-heading text-6xl font-black uppercase tracking-wider">
          {t("podiumTitle")}
        </p>
        <p className="text-lg text-muted-foreground">{t("podiumEmpty")}</p>
      </div>
    );
  }

  const podiumTeams = PODIUM_LAYOUT.map(({ rank, heightClass }) => ({
    team: ranked[rank - 1] ?? null,
    rank,
    heightClass,
  }));
  const remaining = ranked.slice(3);

  return (
    <div className="flex w-full max-w-5xl flex-col items-center gap-12">
      <p className="font-heading text-5xl font-black uppercase tracking-wider md:text-6xl">
        {t("podiumTitle")}
      </p>

      <div className="flex w-full items-end justify-center gap-4 md:gap-8">
        {podiumTeams.map(({ team, rank, heightClass }) => {
          if (!team) {
            return (
              <div
                key={`empty-${rank}`}
                className={`flex w-32 flex-col items-center justify-end gap-2 rounded-md border border-dashed border-border ${heightClass} opacity-30`}
                aria-hidden
              >
                <span className="font-heading text-3xl font-black tabular-nums">
                  {rank}
                </span>
              </div>
            );
          }
          return (
            <motion.div
              key={team.id}
              className="flex w-32 flex-col items-center gap-2 md:w-40"
              initial={{ opacity: 0, y: 48 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: PODIUM_RISE_DELAY[rank],
                type: "spring",
                stiffness: 120,
                damping: 14,
              }}
            >
              <span aria-hidden className="text-5xl">
                {team.avatarEmoji}
              </span>
              <p className="text-center font-heading text-lg uppercase tracking-wider">
                {team.name}
              </p>
              <p className="font-heading text-3xl font-black tabular-nums">
                {team.totalScore}
              </p>
              <div
                className={`flex w-full flex-col items-center justify-center rounded-t-md border-t-4 bg-card ${heightClass}`}
                style={{
                  borderTopColor: PODIUM_COLORS[rank],
                  borderLeft: `1px solid ${team.color}`,
                  borderRight: `1px solid ${team.color}`,
                }}
              >
                <span className="font-heading text-6xl font-black tabular-nums">
                  {rank}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {remaining.length > 0 && (
        <ol className="w-full max-w-2xl space-y-2">
          {remaining.map((team, index) => (
            <motion.li
              key={team.id}
              className="flex items-center gap-4 rounded-md border border-border bg-card px-4 py-3"
              style={{ borderLeftColor: team.color, borderLeftWidth: 4 }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.08, duration: 0.3 }}
            >
              <span className="font-heading w-10 text-2xl font-black tabular-nums">
                {index + 4}
              </span>
              <span aria-hidden className="text-2xl">
                {team.avatarEmoji}
              </span>
              <span className="flex-1 truncate font-heading text-lg uppercase tracking-wider">
                {team.name}
              </span>
              <span className="font-heading text-2xl font-black tabular-nums">
                {team.totalScore}
              </span>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}
