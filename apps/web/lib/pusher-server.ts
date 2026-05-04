import "server-only";
import Pusher from "pusher";

// Server-side Pusher client. Used by Server Actions to broadcast game
// events to all subscribed clients. CLAUDE.md §5.2 spells out the channel
// naming convention; helpers below enforce it so callers don't free-form
// channel names.

let cached: Pusher | null = null;

function getClient(): Pusher {
  if (cached) return cached;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER ?? "eu";
  if (!appId || !key || !secret) {
    throw new Error(
      "Pusher server credentials missing (PUSHER_APP_ID / PUSHER_KEY / PUSHER_SECRET)."
    );
  }

  cached = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });
  return cached;
}

// Channel name builders — single source of truth.
export function quizChannel(joinCode: string): string {
  return `quiz:${joinCode}`;
}
export function quizHostChannel(joinCode: string): string {
  return `quiz:${joinCode}:host`;
}
export function teamPresenceChannel(teamId: string): string {
  return `presence-team:${teamId}`;
}

/**
 * Broadcast event names. Keep flat strings so the same constants can be
 * imported on the client without pulling in this server-only module.
 */
export const PUSHER_EVENTS = {
  questionStarted: "question-started",
  questionRevealed: "question-revealed",
  scoresUpdated: "scores-updated",
  sessionPaused: "session-paused",
  sessionResumed: "session-resumed",
  sessionFinished: "session-finished",
  // Host-only.
  answerCount: "answer-count",
} as const;

export type PusherEventName =
  (typeof PUSHER_EVENTS)[keyof typeof PUSHER_EVENTS];

export async function broadcast(
  channel: string,
  event: PusherEventName,
  data: unknown
): Promise<void> {
  await getClient().trigger(channel, event, data);
}
