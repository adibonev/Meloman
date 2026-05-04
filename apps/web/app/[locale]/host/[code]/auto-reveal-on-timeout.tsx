"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { revealAnswerAction } from "./actions";

export function AutoRevealOnTimeout({
  code,
  endsAtMs,
  questionId,
  serverNowMs,
}: {
  code: string;
  endsAtMs: number | null;
  questionId: string;
  serverNowMs: number;
}) {
  const router = useRouter();
  const hasTriggeredRef = useRef(false);
  const [clockOffsetMs] = useState(() => serverNowMs - Date.now());
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (endsAtMs === null) return;

    hasTriggeredRef.current = false;
    const currentServerNowMs = Date.now() + clockOffsetMs;
    const delayMs = Math.max(0, endsAtMs - currentServerNowMs);

    const timeoutId = window.setTimeout(() => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;

      startTransition(async () => {
        const result = await revealAnswerAction(code);
        if ("ok" in result || result.errorKey === "invalidState") {
          router.refresh();
        }
      });
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [clockOffsetMs, code, endsAtMs, questionId, router, startTransition]);

  return null;
}
