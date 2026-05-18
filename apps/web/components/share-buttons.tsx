"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// Two share actions that actually work on the web:
//  - Facebook: the real share dialog (works everywhere).
//  - Share: the device share sheet via navigator.share — on a phone
//    this opens Messenger / Instagram / Viber / etc. for real (the
//    only way to share a link to those from the web). On desktop,
//    where share sheets are limited, it falls back to copying the
//    link with visible feedback.
export function ShareButtons({ url }: { url: string }) {
  const t = useTranslations("Share");
  const [copied, setCopied] = useState(false);

  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    url
  )}`;

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        // user dismissed the sheet — nothing to do
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — silently ignore
    }
  }

  return (
    <div className="mt-12 flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {t("title")}
      </span>

      <a
        href={fbHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
          <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6 4.39 10.97 10.13 11.87v-8.4H7.08v-3.47h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.47h-2.8v8.4C19.61 23.04 24 18.07 24 12.07z" />
        </svg>
        Facebook
      </a>

      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
      >
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        {copied ? t("copied") : t("share")}
      </button>
    </div>
  );
}
