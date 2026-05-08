"use client";

import { useEffect, useRef, useState } from "react";

// Plays a quiz audio clip during the "active" window of a question.
//
// Two timing rules from CLAUDE.md §4.6 / memory:
//   1. The answer timer is the source of truth. If the timer ends before the
//      clip finishes, playback is cut. If the clip finishes first, the rest
//      of the timer is silence.
//   2. Reveal/lobby/finished states must stop playback.
//
// IMPORTANT: the parent server component re-generates a fresh R2 signed URL
// on every render. Pusher events (e.g. a player joining) trigger
// router.refresh() and the page re-renders mid-clip. Binding `<audio src>`
// directly to the prop would re-load the source and restart playback every
// time. We solve that by setting `src` imperatively, keyed only on the
// question id. The component is also expected to be mounted with
// key={questionId} by the parent.
export function AudioClipPlayer({
  active,
  endsAtMs,
  questionId,
  serverNowMs,
  signedUrl,
}: {
  active: boolean;
  endsAtMs: number | null;
  questionId: string;
  serverNowMs: number;
  signedUrl: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const signedUrlRef = useRef(signedUrl);
  const [clockOffsetMs] = useState(() => serverNowMs - Date.now());
  const [hasError, setHasError] = useState(false);

  // Sync the latest signed URL into the ref without depending on it for
  // rendering. The play effect below reads it only when questionId flips.
  useEffect(() => {
    signedUrlRef.current = signedUrl;
  }, [signedUrl]);

  // Set the audio source once per question. Subsequent prop refreshes that
  // only change the URL signature (not the underlying file) are ignored.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = signedUrlRef.current;
    audio.load();
  }, [questionId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!active || endsAtMs === null) {
      audio.pause();
      return;
    }

    const remainingMs = endsAtMs - (Date.now() + clockOffsetMs);
    if (remainingMs <= 0) {
      audio.pause();
      return;
    }

    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Autoplay blocked or transient failure. The host can press the
        // visible play button to recover; we don't crash the presentation.
        // Caller is expected to give us a fresh `key` per question, so this
        // error state resets cleanly on the next question.
        setHasError(true);
      });
    }

    const cutoffId = window.setTimeout(() => {
      audio.pause();
    }, remainingMs);

    return () => {
      window.clearTimeout(cutoffId);
      audio.pause();
    };
  }, [active, clockOffsetMs, endsAtMs, questionId]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Hidden audio element handles playback; the visible UI is the vinyl */}
      {/* animation in the parent component. We expose `controls` as a fallback */}
      {/* the host can use if autoplay is blocked. */}
      <audio
        ref={audioRef}
        preload="auto"
        controls={hasError}
        className={hasError ? "w-full max-w-md" : "sr-only"}
      />
    </div>
  );
}
