/** @type {import('tailwindcss').Config} */
// NativeWind v4 needs Tailwind v3 (pinned in devDependencies). The warm
// palette mirrors src/lib/theme.ts / packages/shared/design-tokens.ts so
// className styling renders identically to the StyleSheet it replaces
// (CLAUDE.md §2.2 — no behaviour change, styling only).
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#2A2520",
        card: "#3A3530",
        elevated: "#4A453F",
        border: "#3A3530",
        "border-strong": "#4A453F",
        accent: "#FFD166",
        "accent-hover": "#FFB845",
        fg: "#F5E6D3",
        muted: "#B5A88F",
        dim: "#8A7E6B",
        danger: "#F87171",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "40px",
      },
    },
  },
  plugins: [],
};
