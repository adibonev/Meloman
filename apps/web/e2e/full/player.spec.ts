import { expect, test } from "@playwright/test";
import { PLAYER_STATE } from "../auth-paths";

// Player-facing surface as a signed-in player (separate session from the
// admin specs). Confirms authed-only profile data renders and the
// content nav works.
test.use({ storageState: PLAYER_STATE });

test.describe("player surface", () => {
  test("signed-in player sees their profile", async ({ page }) => {
    await page.goto("/en/profile");
    await expect(
      page.getByRole("heading", { name: "Profile" })
    ).toBeVisible();
    // Authed: the sign-in prompt must NOT be shown, and the XP stat is.
    await expect(
      page.getByText("Sign in to see your profile.")
    ).toHaveCount(0);
    await expect(page.getByText("Total XP")).toBeVisible();
  });

  test("player navigates the content sections", async ({ page }) => {
    await page.goto("/en/stories");
    // Scope to the top nav — the footer repeats these links. The nav
    // offers Stories / Song of the Day (Profile is reached via the home
    // card, not the nav) plus the authed Log out control.
    const nav = page.getByRole("navigation");
    await nav
      .getByRole("link", { name: "Song of the Day", exact: true })
      .click();
    await expect(page).toHaveURL(/\/en\/daily/);
    await nav
      .getByRole("link", { name: "Stories", exact: true })
      .click();
    await expect(page).toHaveURL(/\/en\/stories/);
    await expect(
      nav.getByRole("button", { name: "Log out" })
    ).toBeVisible();
  });
});
