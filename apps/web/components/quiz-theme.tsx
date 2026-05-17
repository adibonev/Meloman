import type { ReactNode } from "react";

export type QuizThemeName = "modern" | "vintage" | "neon";

/**
 * Scopes a per-quiz visual theme to the quiz experience only (host
 * presentation, host lobby, player live screen). `modern` inherits the
 * warm app default (no CSS override exists for it on purpose); `vintage`
 * / `neon` re-skin the shared CSS variables for this subtree via
 * `[data-quiz-theme]` in globals.css. The rest of the app + admin chrome
 * stay on the default warm theme.
 */
export function QuizTheme({
  theme,
  children,
  className,
}: {
  theme: QuizThemeName;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-quiz-theme={theme}
      className={
        className ?? "min-h-screen bg-background text-foreground"
      }
    >
      {children}
    </div>
  );
}
