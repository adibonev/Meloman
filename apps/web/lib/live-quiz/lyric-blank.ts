import { LYRIC_BLANK_PLACEHOLDER } from "@/lib/schemas/question";

export type LyricSegment =
  | { type: "text"; value: string }
  | { type: "blank"; index: number; revealedWord: string | null };

// Splits a lyric line on the literal "___" placeholder so the renderer
// can put visual blank slots in place of underscores. Each blank knows
// its zero-based index, which maps 1:1 to the answers array stored on
// the question. When `correctWords` is provided, the matching word is
// surfaced on the blank for reveal-time display.
export function splitLyricByBlanks(
  text: string,
  correctWords: readonly string[] = []
): LyricSegment[] {
  if (!text) return [];

  const parts = text.split(LYRIC_BLANK_PLACEHOLDER);
  const segments: LyricSegment[] = [];
  let blankIndex = 0;

  parts.forEach((part, i) => {
    if (part.length > 0) {
      segments.push({ type: "text", value: part });
    }
    // A blank exists between every adjacent pair of parts. The trailing
    // edge (no `___` after the last part) has no blank to emit.
    if (i < parts.length - 1) {
      segments.push({
        type: "blank",
        index: blankIndex,
        revealedWord: correctWords[blankIndex] ?? null,
      });
      blankIndex += 1;
    }
  });

  return segments;
}
