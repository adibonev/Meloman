import { expect, test } from "@playwright/test";
import {
  addMcQuestion,
  createQuizWithRound,
  createTwoRoundQuiz,
  uniqueTitle,
} from "./_helpers";

// The quiz/round admin controls the authoring happy-path skips: the
// EditQuizForm (theme/language/team-size + sponsor assignment), round &
// question reordering (the ↑/↓ buttons), the EditRoundForm round-type
// change, and the guest-host video form. The R2 upload itself is a real
// external dependency, so — like the audio/image question specs — the
// video is asserted at the validation boundary (final-only gate +
// missing-file guard), never an actual upload.
test.describe("admin quiz + round depth", () => {
  test("quiz edit persists theme, language, team size and a sponsor", async ({
    page,
  }) => {
    const sponsorName = uniqueTitle("E2E SponsorA");
    const quizTitle = uniqueTitle("E2E QuizEdit");

    await page.goto("/en/admin/sponsors");
    await page.getByLabel("Sponsor name").fill(sponsorName);
    await page.getByRole("button", { name: "Create sponsor" }).click();
    await expect(
      page.getByRole("listitem").filter({ hasText: sponsorName })
    ).toBeVisible();

    await page.goto("/en/admin/quizzes");
    await page.getByRole("link", { name: "New quiz" }).click();
    await page.getByLabel("Title").fill(quizTitle);
    await page.getByRole("button", { name: "Create quiz" }).click();
    await expect(page).toHaveURL(/\/en\/admin\/quizzes\/?$/);

    await page.getByRole("link", { name: quizTitle }).click();
    await expect(page).toHaveURL(/\/en\/admin\/quizzes\/[0-9a-f-]+$/);

    await page.locator("#theme").selectOption("neon");
    await page.locator("#language").selectOption("en");
    await page.locator("#maxTeamSize").fill("6");
    await page.getByRole("checkbox", { name: sponsorName }).check();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/\/en\/admin\/quizzes\/?$/);

    // Re-open and confirm everything round-tripped.
    await page.getByRole("link", { name: quizTitle }).click();
    await expect(page).toHaveURL(/\/en\/admin\/quizzes\/[0-9a-f-]+$/);
    await expect(page.locator("#theme")).toHaveValue("neon");
    await expect(page.locator("#language")).toHaveValue("en");
    await expect(page.locator("#maxTeamSize")).toHaveValue("6");
    await expect(
      page.getByRole("checkbox", { name: sponsorName })
    ).toBeChecked();
  });

  test("rounds can be reordered with the move buttons", async ({ page }) => {
    await createTwoRoundQuiz(
      page,
      uniqueTitle("E2E RoundOrder"),
      "R1 q?",
      "R2 q?"
    );
    // createTwoRoundQuiz leaves us on the quiz detail (Round 1, Round 2).
    await expect(
      page.getByRole("listitem").first()
    ).toContainText("Round 1");

    await page
      .getByRole("listitem")
      .filter({ hasText: "Round 1" })
      .getByRole("button", { name: "Move down" })
      .click();

    await expect(
      page.getByRole("listitem").first()
    ).toContainText("Round 2");
  });

  test("questions can be reordered with the move buttons", async ({
    page,
  }) => {
    const roundUrl = await createQuizWithRound(
      page,
      uniqueTitle("E2E QOrder")
    );
    await addMcQuestion(page, roundUrl, "Question ONE");
    await addMcQuestion(page, roundUrl, "Question TWO");

    await expect(
      page.getByRole("listitem").first()
    ).toContainText("Question ONE");

    await page
      .getByRole("listitem")
      .filter({ hasText: "Question ONE" })
      .getByRole("button", { name: "Move question down" })
      .click();

    await expect(
      page.getByRole("listitem").first()
    ).toContainText("Question TWO");
  });

  test("round-type edit unlocks the guest-video form (final-only + missing-file guard)", async ({
    page,
  }) => {
    const roundUrl = await createQuizWithRound(
      page,
      uniqueTitle("E2E RoundEdit")
    );

    // A standard round: the guest-video form explains it's final-only.
    await expect(
      page.getByText("Available only for Final rounds", { exact: false })
    ).toBeVisible();

    // Change the round to Final + rename it; updateRoundAction redirects
    // to the quiz detail.
    await page.locator("#title").fill("Grand Final");
    await page.locator("#roundType").selectOption("final");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/\/en\/admin\/quizzes\/[0-9a-f-]+$/);

    // Back on the round: edits persisted, and the video form is live.
    await page.goto(roundUrl);
    await expect(page.locator("#title")).toHaveValue("Grand Final");
    await expect(page.locator("#roundType")).toHaveValue("final");
    await expect(
      page.getByText("No video attached yet.")
    ).toBeVisible();

    // Submit with no file → client guard fires (no R2 touched).
    await page.getByRole("button", { name: "Upload video" }).click();
    await expect(page.getByText("Attach an MP4 file.")).toBeVisible();
  });
});
