"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PUSHER_EVENTS,
  getPusherClient,
  quizChannelName,
} from "@/lib/pusher-client";

// Same pattern as the player lobby: subscribe to the quiz channel and
// refresh server data on roster events. The host TV view stays in sync
// with players joining without a manual reload.
export function LiveHost({ code }: { code: string }) {
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

  return null;
}
