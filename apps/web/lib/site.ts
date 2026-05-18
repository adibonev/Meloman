// Stable absolute site origin for build-time / cacheable surfaces
// (sitemap, robots, JSON-LD, OG). Request-derived origin lives in
// ./origin for runtime needs like the QR join link.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://meloman-web.vercel.app";
