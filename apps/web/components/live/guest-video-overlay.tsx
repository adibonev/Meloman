"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Guest-host final round video (CLAUDE.md §3.1). One MP4 per final round
 * the host plays fullscreen on the TV before each question. Deliberately
 * host-triggered, not auto-played: the game timer is server-authoritative
 * (§4.4) and only runs in `active`, so the host plays this during reveal
 * or before advancing — playback never races a live countdown. No state
 * machine changes; pure presentation overlay.
 *
 * Click-to-close only (backdrop or the ✕). It intentionally does not bind
 * Escape so it can't fight the presentation shell's own ESC handler.
 */
export function GuestVideoOverlay({ signedUrl }: { signedUrl: string }) {
  const t = useTranslations("HostPresent");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-primary px-2 py-1 text-primary hover:bg-primary/10"
      >
        {t("guestVideoButton")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            aria-label={t("guestVideoClose")}
            onClick={() => setOpen(false)}
            className="fixed right-4 top-4 z-50 flex size-10 items-center justify-center rounded-full border border-border bg-background/80 text-lg backdrop-blur transition-colors hover:bg-muted"
          >
            ✕
          </button>
          {/* Stop the backdrop's close handler when interacting with the
              video's own controls (play/pause/scrub). */}
          <video
            src={signedUrl}
            controls
            autoPlay
            onClick={(event) => event.stopPropagation()}
            className="max-h-screen max-w-screen-lg"
          />
        </div>
      )}
    </>
  );
}
