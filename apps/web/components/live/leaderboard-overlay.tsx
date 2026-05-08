"use client";

import { useTranslations } from "next-intl";

export type LeaderboardTeam = {
  id: string;
  name: string;
  color: string;
  avatarEmoji: string;
  totalScore: number;
};

// Fullscreen overlay that ranks teams by total score. Re-renders whenever
// the host page refreshes (Pusher `scores-updated` triggers it), so every
// answer update flows here without the overlay needing its own state.
export function LeaderboardOverlay({
  onClose,
  open,
  teams,
}: {
  onClose: () => void;
  open: boolean;
  teams: LeaderboardTeam[];
}) {
  const t = useTranslations("HostPresent");

  if (!open) return null;

  const ranked = [...teams].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/95 p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl space-y-6"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between">
          <h2 className="font-heading text-5xl font-black uppercase tracking-wider">
            {t("leaderboardTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted/30"
          >
            {t("leaderboardClose")}
          </button>
        </header>

        {ranked.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-6 py-10 text-center text-lg text-muted-foreground">
            {t("leaderboardEmpty")}
          </p>
        ) : (
          <ol className="space-y-2">
            {ranked.map((team, index) => (
              <li
                key={team.id}
                className="flex items-center gap-4 rounded-md border border-border bg-card px-5 py-4"
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
        )}
      </div>
    </div>
  );
}
