import { test as setup, expect } from "@playwright/test";
import { ADMIN_STATE, PLAYER_STATE } from "./auth-paths";

// Logs in through the real UI (exercises the auth flow) with the demo
// accounts from CLAUDE.md §13 and stores the session so the authed
// "full" specs don't each re-login. Credentials are overridable via env.
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "super-admin@meloman.bg";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "demo123";
const PLAYER_EMAIL = process.env.E2E_PLAYER_EMAIL ?? "player@meloman.bg";
const PLAYER_PASSWORD = process.env.E2E_PLAYER_PASSWORD ?? "demo123";

async function signIn(
  page: import("@playwright/test").Page,
  email: string,
  password: string
) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // loginAction redirects to /en on success — wait until we've left the
  // login page so the saved state has the session cookie.
  await page.waitForURL(/\/en\/?(\?.*)?$/, { timeout: 15_000 });
}

setup("authenticate as super admin", async ({ page }) => {
  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await expect(page).not.toHaveURL(/\/login/);
  await page.context().storageState({ path: ADMIN_STATE });
});

setup("authenticate as player", async ({ page }) => {
  await signIn(page, PLAYER_EMAIL, PLAYER_PASSWORD);
  await expect(page).not.toHaveURL(/\/login/);
  await page.context().storageState({ path: PLAYER_STATE });
});
