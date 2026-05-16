"use client";

import { useLiveSync } from "@/lib/use-live-sync";

// Keeps the host TV view in sync with players joining and game state —
// Pusher first, with the §5.4 polling/visibility fallback. Side-effect
// only; renders nothing.
export function LiveHost({ code }: { code: string }) {
  useLiveSync(code);
  return null;
}
