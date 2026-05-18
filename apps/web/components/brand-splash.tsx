"use client";

import { useEffect, useState } from "react";

// Branded loading splash: the big Meloman logo over a spinning ring,
// shown on a real page load / hard refresh, then fades out and fully
// unmounts so it can never block interaction. Mounted once in the
// locale layout — client-side SPA navigation doesn't remount it, so it
// doesn't flash between in-app pages. Client-only on purpose: if JS is
// off the splash simply never appears (content stays usable).
export function BrandSplash() {
  const [phase, setPhase] = useState<"visible" | "leaving" | "gone">(
    "visible"
  );

  useEffect(() => {
    const MIN_MS = 600;
    const FADE_MS = 450;

    function startLeaving() {
      setPhase("leaving");
      window.setTimeout(() => setPhase("gone"), FADE_MS);
    }

    // Stay at least MIN_MS so it doesn't flicker, and not before the
    // document has finished loading.
    const start = performance.now();
    function done() {
      const waited = performance.now() - start;
      window.setTimeout(startLeaving, Math.max(0, MIN_MS - waited));
    }

    if (document.readyState === "complete") {
      done();
    } else {
      window.addEventListener("load", done, { once: true });
      return () => window.removeEventListener("load", done);
    }
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      role="status"
      aria-label="Зареждане"
      aria-hidden={phase === "leaving"}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-background transition-opacity duration-[450ms] ${
        phase === "leaving"
          ? "pointer-events-none opacity-0"
          : "opacity-100"
      }`}
    >
      <div className="relative flex h-44 w-44 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-border border-t-primary" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/meloman-logo-white.png"
          alt="Meloman"
          width={288}
          height={288}
          className="h-28 w-28 animate-pulse object-contain"
        />
      </div>
    </div>
  );
}
