import { colors, quizPalette, type QuizTheme } from "./theme";

const HEX = /^#[0-9A-Fa-f]{6}$/;
const KEYS = Object.keys(colors).sort();

describe("quizPalette", () => {
  test("modern is the warm default palette (unchanged)", () => {
    expect(quizPalette("modern")).toEqual(colors);
  });

  test("falls back to modern for missing / unknown theme", () => {
    expect(quizPalette(undefined)).toEqual(colors);
    expect(quizPalette(null)).toEqual(colors);
    // Unknown string at runtime (e.g. stale API value) must not crash.
    expect(quizPalette("retro" as unknown as QuizTheme)).toEqual(colors);
  });

  test("vintage and neon are distinct, fully-formed palettes", () => {
    const vintage = quizPalette("vintage");
    const neon = quizPalette("neon");

    expect(vintage).not.toEqual(colors);
    expect(neon).not.toEqual(colors);
    expect(vintage).not.toEqual(neon);
    // Backgrounds differ so the theme is visibly applied.
    expect(vintage.bg).not.toBe(colors.bg);
    expect(neon.bg).not.toBe(colors.bg);
  });

  // Regression guard: every theme must expose exactly the same color
  // keys as the default, all valid 6-digit hex. A missing/typo'd key
  // would silently break a NativeWind color the play screen relies on
  // and drift mobile out of sync with the web [data-quiz-theme] blocks.
  test.each(["modern", "vintage", "neon"] as const)(
    "%s palette has the full key set, all hex",
    (theme) => {
      const p = quizPalette(theme) as Record<string, string>;
      expect(Object.keys(p).sort()).toEqual(KEYS);
      for (const key of KEYS) {
        expect(p[key]).toMatch(HEX);
      }
    }
  );
});
