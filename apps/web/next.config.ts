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
};

export default withNextIntl(nextConfig);
