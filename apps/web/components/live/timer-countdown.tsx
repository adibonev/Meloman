"use client";

import { useEffect, useState } from "react";

export function getCountdownRemainingMs(
  endsAtMs: number | null,
  nowMs: number,
  active: boolean
): number {
  if (!active || endsAtMs === null) return 0;
  return Math.max(0, endsAtMs - nowMs);
}

export function formatCountdownTime(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

export function TimerCountdown({
  active,
  endedLabel,
  endsAtMs,
  label,
  serverNowMs,
}: {
  active: boolean;
  endedLabel: string;
  endsAtMs: number | null;
  label: string;
  serverNowMs: number;
}) {
  const [clockOffsetMs] = useState(() => serverNowMs - Date.now());
  const [nowMs, setNowMs] = useState(serverNowMs);

  useEffect(() => {
    if (!active || endsAtMs === null) return;

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now() + clockOffsetMs);
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [active, clockOffsetMs, endsAtMs]);

  if (!active || endsAtMs === null) return null;

  const remainingMs = getCountdownRemainingMs(endsAtMs, nowMs, active);
  const isEnded = remainingMs <= 0;

  return (
    <p
      aria-live="polite"
      className="inline-flex w-fit items-center gap-2 rounded-md bg-foreground/10 px-3 py-1 text-sm"
    >
      <span className="text-xs uppercase tracking-widest text-muted-foreground">
        {isEnded ? endedLabel : label}
      </span>
      {!isEnded && (
        <span className="font-mono tabular-nums">
          {formatCountdownTime(remainingMs)}
        </span>
      )}
    </p>
  );
}
