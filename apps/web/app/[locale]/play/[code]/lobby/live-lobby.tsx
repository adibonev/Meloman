"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PUSHER_EVENTS,
  getPusherClient,
  quizChannelName,
} from "@/lib/pusher-client";

// Subscribes to the quiz channel and triggers `router.refresh()` when the
// server-side state changes — server actions on join broadcast
// `scoresUpdated`, and the host's start/finish actions broadcast their own
// session events. Refresh is cheap (server component re-renders, no client
// reset) so we don't need fine-grained event handling here.
export function LiveLobby({
  code,
  sessionStatus,
}: {
  code: string;
  sessionStatus: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(quizChannelName(code));

    const refresh = () => router.refresh();

    channel.bind(PUSHER_EVENTS.scoresUpdated, refresh);
    channel.bind(PUSHER_EVENTS.questionStarted, refresh);
    channel.bind(PUSHER_EVENTS.questionRevealed, refresh);
    channel.bind(PUSHER_EVENTS.sessionFinished, refresh);

    return () => {
      channel.unbind(PUSHER_EVENTS.scoresUpdated, refresh);
      channel.unbind(PUSHER_EVENTS.questionStarted, refresh);
      channel.unbind(PUSHER_EVENTS.questionRevealed, refresh);
      channel.unbind(PUSHER_EVENTS.sessionFinished, refresh);
      pusher.unsubscribe(quizChannelName(code));
    };
  }, [code, router]);

  // The component only manages a side-effect — it deliberately renders
  // nothing. `sessionStatus` is in the prop list so a status flip from
  // outside still re-runs the effect cleanly.
  void sessionStatus;
  return null;
}
