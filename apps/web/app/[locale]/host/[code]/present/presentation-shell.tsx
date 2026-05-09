"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  LeaderboardOverlay,
  type LeaderboardTeam,
} from "@/components/live/leaderboard-overlay";
import {
  continueFromBetweenRoundsAction,
  nextQuestionAction,
  pauseSessionAction,
  resumeSessionAction,
  revealAnswerAction,
  startQuizAction,
} from "../actions";

type SessionStatus =
  | "lobby"
  | "active"
  | "reveal"
  | "between_rounds"
  | "paused"
  | "finished";

type ServerErrorKey =
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "invalidState"
  | "noQuestions"
  | "noCurrentQuestion"
  | "answerNotFound"
  | "wrongQuestionType"
  | "generic";

// Wraps the static presentation body, owns the host-side ergonomics:
//   - keyboard shortcuts (SPACE for advance, L for leaderboard, ESC to close)
//   - leaderboard overlay open/close state
//   - server action dispatch with surfaced error
//
// CLAUDE.md §3.1 also lists P for pause/resume. This shell wires that
// shortcut to the host actions, preserving timer state on the server.
export function PresentationShell({
  children,
  code,
  isHost,
  status,
  teams,
  sponsors,
}: {
  children: React.ReactNode;
  code: string;
  isHost: boolean;
  status: SessionStatus;
  teams: LeaderboardTeam[];
  // Optional sponsors: rendered in the footer of the fullscreen
  // presentation so the venue brand is visible to the room without
  // blocking the question or leaderboard.
  sponsors: { id: string; name: string; logoUrl: string | null }[];
}) {
  const t = useTranslations("HostPresent");
  const router = useRouter();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [serverErrorKey, setServerErrorKey] = useState<ServerErrorKey | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const advance = useCallback(() => {
    if (!isHost) return;

    // SPACE drives the whole flow:
    //   lobby           → start quiz
    //   active          → reveal answer
    //   reveal          → next question (or open between-rounds slide)
    //   between_rounds  → continue into next round (apply cutoff)
    // paused / finished have their own UX paths.
    let action:
      | typeof startQuizAction
      | typeof revealAnswerAction
      | typeof nextQuestionAction
      | typeof continueFromBetweenRoundsAction;
    if (status === "lobby") action = startQuizAction;
    else if (status === "active") action = revealAnswerAction;
    else if (status === "reveal") action = nextQuestionAction;
    else if (status === "between_rounds") action = continueFromBetweenRoundsAction;
    else return;

    setServerErrorKey(null);
    startTransition(async () => {
      const result = await action(code);
      if ("errorKey" in result) {
        setServerErrorKey(result.errorKey);
        return;
      }
      router.refresh();
    });
  }, [code, isHost, router, status]);

  const togglePause = useCallback(() => {
    if (!isHost) return;
    let action: typeof pauseSessionAction | typeof resumeSessionAction;
    if (status === "active" || status === "reveal") action = pauseSessionAction;
    else if (status === "paused") action = resumeSessionAction;
    else return;

    setServerErrorKey(null);
    startTransition(async () => {
      const result = await action(code);
      if ("errorKey" in result) {
        setServerErrorKey(result.errorKey);
        return;
      }
      router.refresh();
    });
  }, [code, isHost, router, status]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea" || target.isContentEditable) {
          return;
        }
      }

      if (event.code === "Space") {
        event.preventDefault();
        advance();
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        togglePause();
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        setShowLeaderboard((open) => !open);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        if (showLeaderboard) {
          setShowLeaderboard(false);
          return;
        }
        router.push(`/host/${code}`);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [advance, code, router, showLeaderboard, togglePause]);

  return (
    <>
      <div className="relative flex min-h-screen flex-col bg-background text-foreground">
        {/* Floating exit button. Always visible in the top-right corner so the */}
        {/* host has an obvious way out of the fullscreen presentation, even */}
        {/* when the page header is hidden by a question takeover. */}
        <Link
          aria-label={t("exitFullscreen")}
          href={`/host/${code}`}
          className="fixed right-4 top-4 z-40 flex size-10 items-center justify-center rounded-full border border-border bg-background/80 text-lg backdrop-blur transition-colors hover:bg-muted"
        >
          ✕
        </Link>
        {/* Paused indicator. The presentation body keeps rendering frozen */}
        {/* so the host can review the question, but a full-width banner */}
        {/* makes the pause unmistakable from anywhere in the room. */}
        {status === "paused" && (
          <div className="pointer-events-none fixed inset-x-0 top-0 z-30 border-b-2 border-foreground bg-foreground/95 px-6 py-4 text-background backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-center gap-5">
              <span aria-hidden className="text-5xl leading-none">
                ⏸
              </span>
              <div className="text-center">
                <p className="font-heading text-3xl font-black uppercase tracking-widest md:text-4xl">
                  {t("pausedBadge")}
                </p>
                <p className="text-xs uppercase tracking-widest opacity-80">
                  {t("pausedHint")}
                </p>
              </div>
            </div>
          </div>
        )}
        {children}

        <footer className="border-t border-border bg-card/40 px-6 py-3">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <div className="flex flex-wrap items-center gap-4">
              <span>{t("hint.space")}</span>
              <span>{t("hint.pause")}</span>
              <span>{t("hint.leaderboard")}</span>
              <span>{t("hint.exit")}</span>
            </div>
            {sponsors.length > 0 && <SponsorStrip sponsors={sponsors} />}
            <div className="flex items-center gap-3">
              {isPending && <span>{t("working")}</span>}
              {serverErrorKey && (
                <span className="text-destructive">
                  {t(`errors.${serverErrorKey}`)}
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowLeaderboard(true)}
                className="rounded-md border border-border px-2 py-1 hover:bg-muted/30"
              >
                {t("leaderboardButton")}
              </button>
            </div>
          </div>
        </footer>
      </div>

      <LeaderboardOverlay
        onClose={() => setShowLeaderboard(false)}
        open={showLeaderboard}
        teams={teams}
      />
    </>
  );
}

function SponsorStrip({
  sponsors,
}: {
  sponsors: { id: string; name: string; logoUrl: string | null }[];
}) {
  const t = useTranslations("HostPresent");

  return (
    <div
      className="flex min-w-0 flex-1 items-center justify-center gap-3 normal-case tracking-normal"
      aria-label={t("sponsorsLabel")}
    >
      <span className="shrink-0 text-[10px] uppercase tracking-widest opacity-60">
        {t("sponsorsLabel")}
      </span>
      <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-3 gap-y-2">
        {sponsors.map((sponsor) => (
          <SponsorBadge key={sponsor.id} sponsor={sponsor} />
        ))}
      </div>
    </div>
  );
}

// Renders a compact sponsor badge. Tries the logo first; if it
// fails to load (404, CORS error, etc.) we fall back to plain text so
// the host doesn't see a broken-image icon next to the venue name.
function SponsorBadge({
  sponsor,
}: {
  sponsor: { name: string; logoUrl: string | null };
}) {
  const [logoFailed, setLogoFailed] = useState(false);

  const showLogo = sponsor.logoUrl && !logoFailed;

  return (
    <div className="flex items-center border-l border-border pl-3">
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external host, intentionally not optimized
        <img
          src={sponsor.logoUrl ?? undefined}
          alt={sponsor.name}
          className="h-7 max-w-32 object-contain"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span className="max-w-36 truncate font-heading text-base text-foreground">
          {sponsor.name}
        </span>
      )}
    </div>
  );
}
