"use client";

import { useLiveSync } from "@/lib/use-live-sync";

// Keeps the player phone in sync with the server — Pusher first, with the
// §5.4 polling/visibility fallback so a flaky venue connection or a
// phone waking from sleep still catches up. Side-effect only.
export function LiveLobby({
  code,
  sessionStatus,
}: {
  code: string;
  sessionStatus: string;
}) {
  useLiveSync(code);

  // `sessionStatus` stays in the prop list so a status flip from outside
  // re-renders this client boundary cleanly even though the hook keys off
  // `code` alone.
  void sessionStatus;
  return null;
}
