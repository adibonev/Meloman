"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PUSHER_EVENTS,
  getPusherClient,
  quizChannelName,
} from "@/lib/pusher-client";

// How often to re-fetch server state while the websocket is down. The DB
// is the source of truth (CLAUDE.md §5.4), so a host TV / player phone
// still advances on a Pusher outage or flaky venue wifi — just with a
// few seconds of lag instead of instantly.
const FALLBACK_POLL_MS = 5000;

const LIVE_EVENTS = [
  PUSHER_EVENTS.scoresUpdated,
  PUSHER_EVENTS.questionStarted,
  PUSHER_EVENTS.questionRevealed,
  PUSHER_EVENTS.sessionPaused,
  PUSHER_EVENTS.sessionResumed,
  PUSHER_EVENTS.sessionFinished,
] as const;

/**
 * Keeps a live-quiz screen in sync with the server. Primary path is the
 * Pusher subscription (instant `router.refresh()` on game events). On top
 * of that it adds the resilience CLAUDE.md §5.4 calls for:
 *
 *  - **Fallback polling**: while the connection is anything other than
 *    `connected` (Pusher down, network drop), poll the server so the
 *    screen still moves; stop and catch up once the socket is back.
 *  - **Tab/network recovery**: a host who reopened the laptop or a phone
 *    that woke from sleep resyncs on visibility without a manual reload.
 *
 * Shared by the host and player views so both behave identically.
 */
export function useLiveSync(code: string): void {
  const router = useRouter();

  useEffect(() => {
    const pusher = getPusherClient();
    const channelName = quizChannelName(code);
    const channel = pusher.subscribe(channelName);
    const refresh = () => router.refresh();

    for (const event of LIVE_EVENTS) channel.bind(event, refresh);

    let pollTimer: ReturnType<typeof setInterval> | null = null;
    // True once we've actually lost the socket, so reconnecting triggers a
    // single catch-up refresh — but a normal first connect right after
    // page load does not (the page just rendered fresh data).
    let wasDisconnected = false;

    function startPolling() {
      if (pollTimer) return;
      pollTimer = setInterval(refresh, FALLBACK_POLL_MS);
    }
    function stopPolling() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }

    function onStateChange(states: { current: string }) {
      if (states.current === "connected") {
        stopPolling();
        if (wasDisconnected) {
          wasDisconnected = false;
          refresh();
        }
      } else {
        wasDisconnected = true;
        startPolling();
      }
    }
    pusher.connection.bind("state_change", onStateChange);

    // If the socket isn't up yet on mount (slow connect, immediate
    // outage), start polling now rather than waiting for the first
    // state_change.
    if (pusher.connection.state !== "connected") {
      wasDisconnected = true;
      startPolling();
    }

    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      for (const event of LIVE_EVENTS) channel.unbind(event, refresh);
      pusher.connection.unbind("state_change", onStateChange);
      document.removeEventListener("visibilitychange", onVisible);
      stopPolling();
      pusher.unsubscribe(channelName);
    };
  }, [code, router]);
}
