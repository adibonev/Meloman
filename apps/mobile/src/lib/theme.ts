// Premium warm mid-tone theme — mirrors packages/shared/design-tokens.ts
// and apps/web/app/globals.css. Keep all three in sync.
export const colors = {
  bg: "#2A2520", // warm mid-tone background
  card: "#3A3530", // elevated cards
  elevated: "#4A453F", // hover / secondary surface
  border: "#3A3530", // subtle border
  borderStrong: "#4A453F",
  accent: "#FFD166", // clean gold
  accentHover: "#FFB845",
  fg: "#F5E6D3", // cream white
  muted: "#B5A88F", // warm muted
  dim: "#8A7E6B",
  danger: "#F87171",
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 };

export type QuizTheme = "modern" | "vintage" | "neon";
export type Palette = typeof colors;

// Per-quiz palettes for the live quiz screen only — mirrors the web
// `[data-quiz-theme]` blocks in apps/web/app/globals.css. `modern` is
// the default warm theme; vintage/neon re-skin while the quiz runs.
const QUIZ_PALETTES: Record<QuizTheme, Palette> = {
  modern: colors,
  vintage: {
    bg: "#241405",
    card: "#3A2412",
    elevated: "#4A2E16",
    border: "#4A2E16",
    borderStrong: "#5A3A1E",
    accent: "#E8833A",
    accentHover: "#F0A05A",
    fg: "#F3E2C7",
    muted: "#C9A877",
    dim: "#9A7F55",
    danger: "#F87171",
  },
  neon: {
    bg: "#0B0A1F",
    card: "#15123A",
    elevated: "#1E1A4D",
    border: "#2A2470",
    borderStrong: "#3A348A",
    accent: "#FF2EC4",
    accentHover: "#FF6FDA",
    fg: "#E6E6FF",
    muted: "#8FA6FF",
    dim: "#6E7BC0",
    danger: "#FB7185",
  },
};

export function quizPalette(theme: QuizTheme | undefined | null): Palette {
  return QUIZ_PALETTES[theme ?? "modern"] ?? colors;
}
