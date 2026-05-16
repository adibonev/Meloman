import { expect, test } from "@playwright/test";

// Live-quiz *entry* happy path — the deterministic, DB-safe slice:
// player join landing + host route protection, on the Bulgarian default
// (no locale prefix) which is the real-world path players hit from the
// QR shown on the TV (B1) and the host opens for the presentation (C).
//
// A full authenticated multi-actor game sim (host starts, player
// submits, reveal, leaderboard) needs a dedicated seeded test DB and
// Pusher timing control — tracked in docs/backlog.md as a larger
// post-MVP e2e, kept out of CI so the suite stays green and fast.
test.describe("live quiz entry", () => {
  test("player join on the default locale shows a helpful message for a bad code", async ({
    page,
  }) => {
    await page.goto("/play/ZZZ999999");

    await expect(
      page.getByRole("heading", {
        name: "Не намираме quiz с код ZZZ999999",
      })
    ).toBeVisible();
    await expect(
      page.getByText("Провери кода с домакина и опитай отново.")
    ).toBeVisible();
  });

  test("host lobby is protected on the default locale", async ({ page }) => {
    await page.goto("/host/ZZZ999");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Влез в акаунта си")).toBeVisible();
  });

  test("host presentation is protected on the default locale", async ({
    page,
  }) => {
    await page.goto("/host/ZZZ999/present");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Влез в акаунта си")).toBeVisible();
  });
});
