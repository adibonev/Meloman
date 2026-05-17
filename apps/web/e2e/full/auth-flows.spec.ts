import { expect, test } from "@playwright/test";

// Auth completeness the smoke set only validates client-side: a real
// registration (writes a user — hence the local-only `full` project),
// the login success + logout round-trip, and the wrong-password server
// error. Each test uses a fresh anonymous context so the project's
// stored super-admin session doesn't shadow the public auth screens.
test.describe("auth flows", () => {
  test("register, then log in, then log out", async ({ browser }) => {
    const stamp = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const email = `e2e-auth-${stamp}@example.com`;
    const password = "Password123";

    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      // --- Register ---
      await page.goto("/en/register");
      await page.getByLabel("Display name").fill("E2E Auth");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page.getByLabel("Confirm password").fill(password);
      await page.getByRole("button", { name: "Sign up" }).click();

      await expect(page).toHaveURL(/\/en\/login/, { timeout: 15_000 });
      await expect(
        page.getByText(
          "Registration successful! Sign in with your new account."
        )
      ).toBeVisible();

      // --- Log in with the brand-new account ---
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Sign in" }).click();

      // loginAction signs in and redirects to the locale home.
      await expect(page).toHaveURL(/\/en\/?(\?.*)?$/, { timeout: 15_000 });
      const logout = page.getByRole("button", { name: "Log out" });
      await expect(logout).toBeVisible();

      // --- Log out → signOut redirects to the BG home; assert the
      // login affordance by href so the check is locale-agnostic. ---
      await logout.click();
      await expect(
        page.locator('a[href="/login"]').first()
      ).toBeVisible({ timeout: 15_000 });
      await expect(page).not.toHaveURL(/\/login/);
      await expect(
        page.getByRole("button", { name: "Log out" })
      ).toHaveCount(0);
    } finally {
      await ctx.close();
    }
  });

  test("login rejects a wrong password", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await page.goto("/en/login");
      await page
        .getByLabel("Email")
        .fill("super-admin@meloman.bg");
      await page
        .getByLabel("Password", { exact: true })
        .fill("definitely-wrong-123");
      await page.getByRole("button", { name: "Sign in" }).click();

      await expect(
        page.getByText("Invalid email or password.")
      ).toBeVisible();
      // Still on the login screen — no session was created.
      await expect(page).toHaveURL(/\/en\/login/);
    } finally {
      await ctx.close();
    }
  });
});
