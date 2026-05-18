import type { MetadataRoute } from "next";

// Minimal PWA manifest so the site is installable / themed in mobile
// browsers. No install-prompt JS by design — the manifest alone is
// enough; an aggressive prompt is a deliberate non-goal. Icons reuse
// the brand logo (sizes "any" rather than declaring exact dimensions
// we don't have dedicated assets for).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Meloman",
    short_name: "Meloman",
    description: "Музикален куиз и истории",
    start_url: "/",
    display: "standalone",
    background_color: "#2A2520",
    theme_color: "#2A2520",
    icons: [
      {
        src: "/meloman-logo-white.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
