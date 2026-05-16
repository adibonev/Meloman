import { expect, test } from "@playwright/test";
import { addMcQuestion, createQuizWithRound, uniqueTitle } from "./_helpers";

// Edit + destructive flows. (Quiz deletion isn't exposed in the UI, so
// only quiz edit is covered there; round and question deletion go
// through window.confirm.)
test.describe("admin edit + delete", () => {
  test("edit a quiz title", async ({ page }) => {
    const title = uniqueTitle("E2E Edit");
    const edited = `${title} EDITED`;

    await page.goto("/en/admin/quizzes");
    await page.getByRole("link", { name: "New quiz" }).click();
    await page.getByLabel("Title", { exact: true }).fill(title);
    await page.getByRole("button", { name: "Create quiz" }).click();
    await expect(page).toHaveURL(/\/en\/admin\/quizzes\/?$/);

    await page.getByRole("link", { name: title }).click();
    await page.getByLabel("Title", { exact: true }).fill(edited);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/\/en\/admin\/quizzes\/?$/);
    await expect(
      page.getByRole("link", { name: edited })
    ).toBeVisible();
  });

  test("delete a question, then the round", async ({ page }) => {
    const roundUrl = await createQuizWithRound(
      page,
      uniqueTitle("E2E Delete")
    );
    const qText = "Disposable question?";
    await addMcQuestion(page, roundUrl, qText);

    // Delete the question (window.confirm).
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete question" }).click();
    await expect(page.getByText(qText)).toHaveCount(0);

    // Delete the round (window.confirm) → back on quiz detail.
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete round" }).click();
    await expect(page).toHaveURL(/\/en\/admin\/quizzes\/[0-9a-f-]+$/);
    await expect(
      page.getByRole("link", { name: "Round 1" })
    ).toHaveCount(0);
  });
});
