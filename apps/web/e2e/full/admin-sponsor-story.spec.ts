import { expect, test } from "@playwright/test";

// Sponsor CRUD + the TipTap stories editor (the rich-text editor added
// this session). Timestamped names keep runs isolated on the dev DB.
test.describe("admin sponsors + stories", () => {
  test("create then delete a sponsor", async ({ page }) => {
    const name = `E2E Sponsor ${Date.now()}`;

    await page.goto("/en/admin/sponsors");
    await page.getByLabel("Sponsor name").fill(name);
    await page.getByRole("button", { name: "Create sponsor" }).click();

    const row = page.getByRole("listitem").filter({ hasText: name });
    await expect(row).toBeVisible();

    // Delete goes through window.confirm — accept it.
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Delete" }).click();
    await expect(
      page.getByRole("listitem").filter({ hasText: name })
    ).toHaveCount(0);
  });

  test("create a story with the TipTap editor", async ({ page }) => {
    const title = `E2E Story ${Date.now()}`;

    await page.goto("/en/admin/stories");
    await page.getByRole("link", { name: "New story" }).click();
    await expect(page).toHaveURL(/\/en\/admin\/stories\/new/);

    await page.getByLabel("Title", { exact: true }).fill(title);

    // TipTap renders a contenteditable .ProseMirror node. Exercise the
    // toolbar (Bold) then type the body — onUpdate feeds the hidden
    // name="body" input the server action reads.
    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.getByRole("button", { name: "Bold" }).click();
    await page.keyboard.type("A short story body written by Playwright.");

    await page.getByRole("button", { name: "Save" }).click();

    // createStoryAction redirects to the stories list.
    await expect(page).toHaveURL(/\/en\/admin\/stories\/?$/);
    await expect(page.getByText(title)).toBeVisible();
  });
});
