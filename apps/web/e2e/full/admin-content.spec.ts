import { expect, test } from "@playwright/test";
import { ADMIN_STATE } from "../auth-paths";

// Admin content actions the quiz-authoring specs don't touch: the Daily
// content manager (Song of the Day + Mystery Artist create/delete), User
// management (role change, ban/unban, send reset — exercised on a
// throwaway account so the demo users stay clean), the Stories
// edit/publish toggle, and the Analytics dashboard render.

// Far-future deterministic dates so daily rows never collide with seeded
// content; the action upserts on date so re-runs are safe anyway.
function futureDate(offsetDays: number): string {
  const d = new Date(Date.UTC(2090, 0, 1));
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

test.describe("admin content", () => {
  test("daily: create + delete a Song of the Day and a Mystery Artist", async ({
    page,
  }) => {
    const base = Math.floor(Math.random() * 9000);
    const songDate = futureDate(base);
    const mysteryDate = futureDate(base + 1);

    await page.goto("/en/admin/daily");

    // Song of the Day — keep the prefilled valid SONG_TEMPLATE payload.
    await page.getByLabel("Date").fill(songDate);
    await page
      .getByLabel("Type")
      .selectOption({ label: "Song of the Day" });
    await page.getByRole("button", { name: "Save" }).click();
    const songRow = page.getByRole("row").filter({ hasText: songDate });
    await expect(songRow).toBeVisible();

    // Mystery Artist — swap type + a minimal valid JSON payload.
    await page.getByLabel("Date").fill(mysteryDate);
    await page
      .getByLabel("Type")
      .selectOption({ label: "Mystery Artist" });
    await page
      .getByLabel("Payload (JSON)")
      .fill(
        '{"name":"Lady Gaga","blurredImageUrl":"https://x/y.jpg","hints":["a","b"],"story":"s"}'
      );
    await page.getByRole("button", { name: "Save" }).click();
    const mysteryRow = page
      .getByRole("row")
      .filter({ hasText: mysteryDate });
    await expect(mysteryRow).toBeVisible();

    // Delete both (plain server-action forms — no confirm dialog).
    await songRow.getByRole("button", { name: "Delete" }).click();
    await expect(
      page.getByRole("row").filter({ hasText: songDate })
    ).toHaveCount(0);
    await mysteryRow.getByRole("button", { name: "Delete" }).click();
    await expect(
      page.getByRole("row").filter({ hasText: mysteryDate })
    ).toHaveCount(0);
  });

  test("users: promote, ban/unban and reset on a throwaway account", async ({
    browser,
  }) => {
    const stamp = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const email = `e2e-user-${stamp}@example.com`;

    // Register the victim in a clean anonymous context so the
    // super-admin session on the main page is untouched. Register
    // doesn't sign in — it redirects to /login.
    // Explicit empty state — the full project's default admin
    // storageState would otherwise leak into a bare newContext().
    const anonCtx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const anon = await anonCtx.newPage();
    try {
      await anon.goto("/en/register");
      await anon.getByLabel("Display name").fill("E2E User");
      await anon.getByLabel("Email").fill(email);
      await anon.getByLabel("Password", { exact: true }).fill("Password123");
      await anon.getByLabel("Confirm password").fill("Password123");
      await anon.getByRole("button", { name: "Sign up" }).click();
      await expect(anon).toHaveURL(/\/en\/login/, { timeout: 15_000 });
    } finally {
      await anonCtx.close();
    }

    const page = await browser
      .newContext({ storageState: ADMIN_STATE })
      .then((c) => c.newPage());
    await page.goto("/en/admin/users");

    const row = page.getByRole("row").filter({ hasText: email });
    await expect(row).toBeVisible();

    // player → admin (the "Make admin" button disappears once admin).
    await row.getByRole("button", { name: "Make admin" }).click();
    await expect(
      row.getByRole("button", { name: "Make admin" })
    ).toHaveCount(0);
    await expect(
      row.getByRole("button", { name: "Make player" })
    ).toBeVisible();

    // Ban → Unban round-trip.
    await row.getByRole("button", { name: "Ban" }).click();
    await expect(row.getByText("Banned", { exact: true })).toBeVisible();
    await row.getByRole("button", { name: "Unban" }).click();
    await expect(row.getByText("Active", { exact: true })).toBeVisible();

    // Send reset email (no RESEND key in dev → logs the link, returns
    // ok). Nothing visible changes; just confirm it didn't error out.
    await row.getByRole("button", { name: "Reset password" }).click();
    await expect(
      page.getByRole("heading", { name: "Users" })
    ).toBeVisible();
  });

  test("stories: edit a story and toggle publish/unpublish", async ({
    page,
  }) => {
    const title = `E2E Story ${Date.now()}`;
    const edited = `${title} EDITED`;

    // Create (body is required — type into the TipTap editor).
    await page.goto("/en/admin/stories");
    await page.getByRole("link", { name: "New story" }).click();
    await expect(page).toHaveURL(/\/en\/admin\/stories\/new/);
    await page.getByLabel("Title", { exact: true }).fill(title);
    await page.locator(".ProseMirror").click();
    await page.keyboard.type("Body written by Playwright.");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/en\/admin\/stories\/?$/);

    // Open it → rename + publish.
    await page.getByRole("link", { name: title }).click();
    await expect(page).toHaveURL(/\/en\/admin\/stories\/[0-9a-f-]+$/);
    await page.getByLabel("Title", { exact: true }).fill(edited);
    await page.locator('input[name="published"]').check();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/en\/admin\/stories\/?$/);

    const row = page.getByRole("row").filter({ hasText: edited });
    await expect(row.getByText("Published", { exact: true })).toBeVisible();

    // Re-open → unpublish.
    await page.getByRole("link", { name: edited }).click();
    await expect(page).toHaveURL(/\/en\/admin\/stories\/[0-9a-f-]+$/);
    await page.locator('input[name="published"]').uncheck();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/en\/admin\/stories\/?$/);
    await expect(
      page
        .getByRole("row")
        .filter({ hasText: edited })
        .getByText("Draft", { exact: true })
    ).toBeVisible();
  });

  test("analytics dashboard renders its stat cards", async ({ page }) => {
    await page.goto("/en/admin/analytics");
    await expect(
      page.getByRole("heading", { name: "Analytics" })
    ).toBeVisible();
    // Labels unique to this page (not in the admin nav).
    await expect(page.getByText("Published stories")).toBeVisible();
    await expect(page.getByText("Total views")).toBeVisible();
  });
});
