import { expect, test } from "@playwright/test";

// Password-reset pages (shipped this session). DB-safe + deterministic
// so this lives in the CI smoke set: forgot-password only does a lookup
// (silent for unknown emails — anti-enumeration), and reset-password
// with a bogus token writes nothing.
test.describe("password reset", () => {
  test("forgot-password is reachable from login and confirms generically", async ({
    page,
  }) => {
    await page.goto("/en/login");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/en\/forgot-password/);

    await page
      .getByLabel("Email")
      .fill(`nobody-${Date.now()}@example.com`);
    await page.getByRole("button", { name: "Send reset link" }).click();

    // Same response whether or not the address exists.
    await expect(
      page.getByText(
        "If that email exists, we sent a reset link. It is valid for 15 minutes."
      )
    ).toBeVisible();
  });

  test("reset-password rejects an invalid token", async ({ page }) => {
    await page.goto("/en/reset-password?token=bogus-token");

    await page.getByLabel("New password", { exact: true }).fill("newpass123");
    await page.getByLabel("Confirm password").fill("newpass123");
    await page.getByRole("button", { name: "Save password" }).click();

    await expect(
      page.getByText("This link is invalid or expired.")
    ).toBeVisible();
  });
});
