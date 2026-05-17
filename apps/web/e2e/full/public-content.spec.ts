import { expect, test, type Page } from "@playwright/test";
import { uniqueTitle } from "./_helpers";

// Public-facing content surfaces: the Stories index → magazine detail,
// the Artist spotlight, and the Daily page. The default `full` context
// (admin) is fine — these pages render the same content for everyone,
// and authoring needs the admin anyway.
//
// The MVP public Daily page is display-only (no answer/guess UI — the
// engagement loop is post-MVP, see CLAUDE.md §3.2), and it only ever
// shows *today's* row. We deliberately don't create today's content:
// the daily action upserts on date and would clobber seeded dev data.
// So Daily is a non-destructive render assertion.

/** Create a story, type a body, then publish it via the edit form. */
async function createPublishedStory(
  page: Page,
  opts: { title: string; artist?: string; body: string }
) {
  await page.goto("/en/admin/stories");
  await page.getByRole("link", { name: "New story" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/stories\/new/);
  await page.getByLabel("Title", { exact: true }).fill(opts.title);
  if (opts.artist) {
    await page.getByLabel("Artist", { exact: true }).fill(opts.artist);
  }
  await page.locator(".ProseMirror").click();
  await page.keyboard.type(opts.body);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/stories\/?$/);

  await page.getByRole("link", { name: opts.title }).click();
  await expect(page).toHaveURL(/\/en\/admin\/stories\/[0-9a-f-]+$/);
  await page.locator('input[name="published"]').check();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/stories\/?$/);
}

test.describe("public content", () => {
  test("a published story is featured on /stories and opens its detail", async ({
    page,
  }) => {
    const title = uniqueTitle("E2E Public Story");
    const body = `Magazine body ${Date.now()} by Playwright.`;
    await createPublishedStory(page, { title, body });

    await page.goto("/en/stories");
    // Newest published → it's the featured block.
    await expect(page.getByText("Featured")).toBeVisible();
    await page.getByRole("heading", { name: title }).click();

    await expect(page).toHaveURL(/\/en\/stories\/[^/]+$/);
    await expect(
      page.getByRole("heading", { name: title, level: 1 })
    ).toBeVisible();
    await expect(page.getByText(body)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "All stories" })
    ).toBeVisible();
  });

  test("artist spotlight lists the artist's published stories", async ({
    page,
  }) => {
    // Slug ⇆ artist_name round-trips only when the name has no spaces
    // or hyphens (the page maps "-" → " "); a lowercase digit token is
    // safe and matches the slug exactly.
    const artist = `e2eartist${Date.now()}`;
    const title = uniqueTitle("E2E Artist Story");
    await createPublishedStory(page, {
      title,
      artist,
      body: "Artist spotlight body.",
    });

    await page.goto(`/en/artists/${artist}`);
    await expect(
      page.getByRole("heading", { name: artist, level: 1 })
    ).toBeVisible();
    await expect(
      page.getByText(`Stories about ${artist}`)
    ).toBeVisible();

    await page.getByRole("link", { name: title }).click();
    await expect(page).toHaveURL(/\/en\/stories\/[^/]+$/);
    await expect(
      page.getByRole("heading", { name: title, level: 1 })
    ).toBeVisible();
  });

  test("daily page renders (display-only MVP, non-destructive)", async ({
    page,
  }) => {
    await page.goto("/en/daily");
    await expect(
      page.getByRole("heading", { name: "Song of the Day", level: 1 })
    ).toBeVisible();
    // Either today's card or the empty state — both are valid; we don't
    // mutate today's row, so just assert the page rendered its shell.
    await expect(page.locator("main")).toBeVisible();

    // BG default (no /en prefix) renders too.
    await page.goto("/daily");
    await expect(page.locator("main h1")).toBeVisible();
  });
});
