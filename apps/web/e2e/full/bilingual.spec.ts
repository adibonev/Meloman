import { expect, test } from "@playwright/test";
import { addMcQuestion, createQuizWithRound, uniqueTitle } from "./_helpers";

// Bilingual quizzes (per-question EN overlay). The render-by-locale +
// fallback logic is unit-tested in lib/question-content.test.ts; this
// proves the admin editor persists the overlay round-trip.
test.describe("bilingual quiz authoring", () => {
  test("per-question English overlay persists", async ({ page }) => {
    const roundUrl = await createQuizWithRound(
      page,
      uniqueTitle("E2E Bilingual")
    );
    await addMcQuestion(page, roundUrl, "Кой изпя това?");
    // addMcQuestion leaves us on the round detail.

    await page
      .getByRole("group")
      .filter({ hasText: "English version" })
      .first()
      .locator("summary")
      .click();

    await page
      .getByLabel("Question text (EN)")
      .fill("Who sang this?");
    await page.getByLabel("Option 1 (EN)").fill("Queen");
    await page.getByLabel("Option 2 (EN)").fill("Beatles");
    await page.getByLabel("Option 3 (EN)").fill("ABBA");
    await page.getByLabel("Option 4 (EN)").fill("Pop");
    await page.getByRole("button", { name: "Save English" }).click();

    // Redirects back to the round detail; the overlay now exists so the
    // editor renders open with the saved values.
    await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+$/);
    await expect(
      page.getByLabel("Question text (EN)")
    ).toHaveValue("Who sang this?");
    await expect(page.getByLabel("Option 2 (EN)")).toHaveValue(
      "Beatles"
    );
  });
});
