import { expect, test } from "@playwright/test";
import {
  createQuizWithRound,
  openQuestionForm,
  uniqueTitle,
} from "./_helpers";

// Coverage for every question type's admin form. open_text / lyric_blank
// / decade are created end to end (deterministic). audio / image_reveal
// require an R2 upload, so they assert the form + the required-file
// validation instead — no flaky external dependency.
test.describe("question type forms", () => {
  test("create open_text, lyric_blank and decade questions", async ({
    page,
  }) => {
    const roundUrl = await createQuizWithRound(
      page,
      uniqueTitle("E2E QTypes")
    );

    // open_text
    await openQuestionForm(page, roundUrl, "Open text");
    await page
      .getByLabel("Question text")
      .fill("Which band released 'Bohemian Rhapsody'?");
    await page.getByLabel("Accepted answers").fill("Queen\nQueens");
    await page.getByRole("button", { name: "Create question" }).click();
    await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+$/);
    await expect(
      page.getByText("Which band released 'Bohemian Rhapsody'?")
    ).toBeVisible();

    // lyric_blank — one blank
    await openQuestionForm(page, roundUrl, "Lyric Fill-in");
    await page
      .getByLabel("Lyric text with blanks")
      .fill("We ___ the champions");
    await page.getByLabel("Blank #1").fill("are");
    await page.getByRole("button", { name: "Create question" }).click();
    await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+$/);
    await expect(page.getByText("We ___ the champions")).toBeVisible();

    // decade
    await openQuestionForm(page, roundUrl, "Decade / Year");
    await page
      .getByLabel("Question text")
      .fill("When was 'Thriller' released?");
    await page.getByLabel("Exact year").fill("1982");
    await page.getByRole("button", { name: "Create question" }).click();
    await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+$/);
    await expect(
      page.getByText("When was 'Thriller' released?")
    ).toBeVisible();
  });

  test("audio + image_reveal forms enforce a required file", async ({
    page,
  }) => {
    const roundUrl = await createQuizWithRound(
      page,
      uniqueTitle("E2E QMedia")
    );

    // Fill every required text field so RHF validation passes and the
    // submit reaches the missing-file guard.
    await openQuestionForm(page, roundUrl, "Audio");
    await page.getByLabel("Question text").fill("Name this track.");
    await page.getByLabel("Accepted answers").fill("Queen");
    await page.getByRole("button", { name: "Create question" }).click();
    await expect(page.getByText("Attach an MP3 file.")).toBeVisible();

    await openQuestionForm(page, roundUrl, "Image Reveal");
    await page.getByLabel("Question text").fill("Who is this artist?");
    await page.getByLabel("Accepted answers").fill("Queen");
    // "Other" needs no attribution, so RHF won't block on that.
    await page.getByLabel("Image source").selectOption({ label: "Other" });
    await page.getByRole("button", { name: "Create question" }).click();
    await expect(page.getByText("Attach an image.")).toBeVisible();
  });
});
