import { splitLyricByBlanks } from "@/lib/live-quiz/lyric-blank";

// Renders a lyric question with visual blank slots in place of `___`.
// At active-time the blanks are empty boxes; on reveal each blank
// surfaces its correct word and the ordered answer chips below make it
// easier for the host to read the correct words aloud.
export function LyricBlankDisplay({
  answerOrderLabel,
  blankCountLabel,
  correctWords,
  perBlankPointsLabel,
  reveal,
  text,
}: {
  answerOrderLabel: string;
  blankCountLabel: string;
  correctWords: readonly string[];
  perBlankPointsLabel: string;
  reveal: boolean;
  text: string;
}) {
  const segments = splitLyricByBlanks(text, correctWords);

  return (
    <div className="flex w-full flex-col items-center gap-6">
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
                <span>{segment.revealedWord}</span>
              ) : (
                <span aria-hidden className="text-muted-foreground/40">
                  {" "}
                </span>
              )}
            </span>
          )
        )}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
        <span className="rounded-md border border-border px-3 py-2">
          {blankCountLabel}
        </span>
        <span className="rounded-md border border-border px-3 py-2">
          {perBlankPointsLabel}
        </span>
      </div>

      {reveal && correctWords.length > 0 && (
        <div className="flex max-w-4xl flex-wrap items-center justify-center gap-2">
          <span className="mr-2 text-xs uppercase tracking-widest text-muted-foreground">
            {answerOrderLabel}
          </span>
          {correctWords.map((word, index) => (
            <span
              key={`${word}-${index}`}
              className="rounded-md border border-foreground/60 bg-foreground/10 px-3 py-1 font-heading text-xl uppercase tracking-wider"
            >
              {index + 1}. {word}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
