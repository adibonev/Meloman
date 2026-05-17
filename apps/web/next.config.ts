import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ["@meloman/db", "@meloman/shared"],
  // Pin Turbopack's workspace root to the monorepo, so it ignores the
  // unrelated `package-lock.json` sitting in the user's home folder.
  turbopack: {
    root: path.join(dirname, "..", ".."),
  },
  // Default Server Action body limit is 1 MB. Audio question uploads run
  // up to ~6 MB and a final round's guest-host MP4 intro up to ~30 MB;
  // bump the cap to clear both. (For larger media later, switch the
  // upload to a signed-URL flow — see lib/r2.ts.)
  experimental: {
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
  // The Expo web client is deployed on its own origin
  // (meloman-mobile.vercel.app) and reaches this REST API cross-origin,
  // so the browser needs CORS. Mobile auth is a Bearer token (no
  // cookies), so `*` is safe here and also covers local Expo web.
  // The web app itself calls these routes same-origin and is unaffected.
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PATCH, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
