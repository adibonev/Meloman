"use client";

import Pusher from "pusher-js";

// Client-side Pusher singleton. Lazy-initialized so SSR doesn't try to
// instantiate the WebSocket. Channel name builders mirror pusher-server.ts
// so callers don't have to hand-roll strings.

let cached: Pusher | null = null;

export function getPusherClient(): Pusher {
  if (cached) return cached;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "eu";
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_PUSHER_KEY is missing — set it in .env.local."
    );
  }

  cached = new Pusher(key, {
    cluster,
    // forceTLS: true is the default; explicit for clarity.
    forceTLS: true,
  });
  return cached;
}

export function quizChannelName(joinCode: string): string {
  return `quiz:${joinCode}`;
}
export function quizHostChannelName(joinCode: string): string {
  return `quiz:${joinCode}:host`;
}
export function teamPresenceChannelName(teamId: string): string {
  return `presence-team:${teamId}`;
}

// Re-export event names from a separate constants module — but to avoid a
// circular import path, we redeclare them here. Keep in sync with
// `pusher-server.ts`.
export const PUSHER_EVENTS = {
  questionStarted: "question-started",
  questionRevealed: "question-revealed",
  scoresUpdated: "scores-updated",
  sessionPaused: "session-paused",
  sessionResumed: "session-resumed",
  sessionFinished: "session-finished",
  answerCount: "answer-count",
} as const;
