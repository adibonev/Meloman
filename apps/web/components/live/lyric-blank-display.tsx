import { splitLyricByBlanks } from "@/lib/live-quiz/lyric-blank";

// Renders a lyric question with visual blank slots in place of `___`.
// At active-time the blanks are empty boxes; on reveal each blank
// surfaces its correct word with an underline so the host can call
// out the answer cleanly. Pure server component — no state needed.
export function LyricBlankDisplay({
  reveal,
  correctWords,
  text,
}: {
  reveal: boolean;
  correctWords: readonly string[];
  text: string;
}) {
  const segments = splitLyricByBlanks(text, correctWords);

  return (
    <p className="font-heading text-4xl leading-snug uppercase tracking-wider md:text-6xl">
      {segments.map((segment, idx) =>
        segment.type === "text" ? (
          <span key={`t-${idx}`}>{segment.value}</span>
        ) : (
          <span
            key={`b-${segment.index}`}
            className="mx-2 inline-flex min-w-[6ch] items-baseline justify-center border-b-4 px-2 align-baseline"
            style={{
              borderColor: reveal ? "#fff" : "rgb(168 168 168 / 0.6)",
            }}
          >
            {reveal && segment.revealedWord ? (
              <span className="text-emerald-300">{segment.revealedWord}</span>
            ) : (
              <span aria-hidden className="text-muted-foreground/40">
                {" "}
              </span>
            )}
          </span>
        )
      )}
    </p>
  );
}
