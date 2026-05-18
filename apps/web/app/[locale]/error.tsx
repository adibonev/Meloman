"use client";

import Link from "next/link";

// Friendly error boundary (Meloman-flavored, no i18n on purpose —
// an error boundary must never itself depend on something that can
// throw). `reset` retries the failed render.
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="font-heading text-5xl font-black uppercase tracking-wider">
        Фалшива нота
      </p>
      <p className="max-w-md text-lg text-muted-foreground">
        Нещо прескочи на грешен такт. Опитай пак — обикновено втория
        път върви чисто.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary"
        >
          Опитай пак
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary"
        >
          Към началото
        </Link>
      </div>
    </main>
  );
}
