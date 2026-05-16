import { defineConfig, devices } from "@playwright/test";
import { ADMIN_STATE } from "./e2e/auth-paths";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : "list",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
    // CI-safe set: no auth, no DB writes. `pnpm test:e2e` runs only this
    // so CI stays fast and green.
    {
      name: "smoke",
      testMatch: [
        "public-auth.spec.ts",
        "live-quiz-entry.spec.ts",
        "reset-password.spec.ts",
      ],
      use: { ...devices["Desktop Chrome"] },
    },
    // Logs in with the demo accounts once and stores the session.
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Authed "press every button" flows. Local-only via
    // `pnpm test:e2e:full`; writes throwaway data to the dev DB.
    {
      name: "full",
      testMatch: "full/**/*.spec.ts",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: ADMIN_STATE },
    },
  ],
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          command: `pnpm exec next dev --port ${port}`,
          env: {
            NEXT_TELEMETRY_DISABLED: "1",
          },
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          url: baseURL,
        },
      }),
});
