import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ["@meloman/db"],
  // Pin Turbopack's workspace root to the monorepo, so it ignores the
  // unrelated `package-lock.json` sitting in the user's home folder.
  turbopack: {
    root: path.join(dirname, "..", ".."),
  },
  // Default Server Action body limit is 1 MB. Audio question uploads can be
  // up to ~6 MB; bump the cap to match. (For larger files later, switch the
  // upload to a signed-URL flow — see lib/r2.ts.)
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default withNextIntl(nextConfig);
