import { ImageResponse } from "next/og";

// Default social card for the whole site (home + static pages). Next
// auto-wires og:image from this file convention — no manual metadata,
// no R2. Per-story / per-day dynamic cards are a separate later step.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Meloman — Музикален куиз и истории";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#2A2520",
          color: "#F5E6D3",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: 140,
            fontWeight: 900,
            letterSpacing: 12,
            textTransform: "uppercase",
          }}
        >
          Meloman
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 40,
            color: "#FFD166",
          }}
        >
          Музикален куиз и истории
        </div>
      </div>
    ),
    size
  );
}
