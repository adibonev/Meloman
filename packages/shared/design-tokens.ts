/**
 * Meloman design tokens — single source of truth for the premium warm
 * mid-tone theme. The web app applies these via CSS variables in
 * apps/web/app/globals.css; the mobile app mirrors them in
 * apps/mobile/src/lib/theme.ts (React Native can't read CSS vars).
 * Keep all three in sync when a token changes.
 */
export const colors = {
  bg: "#2A2520", // warm mid-tone background
  elevated: "#3A3530", // cards / popovers
  hover: "#4A453F", // hover / secondary surface
  borderSubtle: "#3A3530",
  borderStrong: "#4A453F",
  accent: "#FFD166", // clean gold
  accentHover: "#FFB845",
  fgPrimary: "#F5E6D3", // cream white
  fgSecondary: "#B5A88F", // warm muted
  fgMuted: "#8A7E6B",
  success: "#4ADE80",
  error: "#F87171",
  warning: "#FBBF24",
  info: "#60A5FA",
} as const;

export const fonts = {
  heading: "Playfair Display", // hero + story titles (italic preferred)
  body: "Inter", // UI: nav, buttons, labels, body
} as const;

export type ColorToken = keyof typeof colors;
