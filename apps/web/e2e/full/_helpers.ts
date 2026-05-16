import { expect, type Page } from "@playwright/test";

// Shared authoring steps so each spec doesn't re-derive the flow.
// Timestamped titles keep dev-DB runs isolated and re-runnable.

export function uniqueTitle(prefix: string): string {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/** Create a quiz, open it, add one round; leaves the page on the round
 *  detail and returns its URL. */
export async function createQuizWithRound(
  page: Page,
  quizTitle: string
): Promise<string> {
  await page.goto("/en/admin/quizzes");
  await page.getByRole("link", { name: "New quiz" }).click();
  await page.getByLabel("Title").fill(quizTitle);
  await page.getByRole("button", { name: "Create quiz" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/quizzes\/?$/);

  await page.getByRole("link", { name: quizTitle }).click();
  await expect(page).toHaveURL(/\/en\/admin\/quizzes\/[0-9a-f-]+$/);

  await page.getByRole("link", { name: "+ Add round" }).click();
  await page.getByLabel("Round title").fill("Round 1");
  await page
    .getByLabel("How many teams advance after this round")
    .fill("0");
  await page.getByRole("button", { name: "Create round" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/quizzes\/[0-9a-f-]+$/);

  await page.getByRole("link", { name: "Round 1" }).click();
  await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+$/);
  return page.url();
}

/** Add one multiple-choice question from a round detail URL; leaves the
 *  page back on the round detail. */
export async function addMcQuestion(
  page: Page,
  roundUrl: string,
  questionText: string
) {
  await openQuestionForm(page, roundUrl, "Multiple Choice");
  await page.getByLabel("Question text").fill(questionText);
  await page.getByLabel("Option A").fill("Right");
  await page.getByLabel("Option B").fill("Wrong 1");
  await page.getByLabel("Option C").fill("Wrong 2");
  await page.getByLabel("Option D").fill("Wrong 3");
  await page.locator('input[name="correctIndex"][value="0"]').check();
  await page.getByLabel("Time limit (seconds)").fill("20");
  await page.getByLabel("Points for correct answer").fill("1");
  await page.getByRole("button", { name: "Create question" }).click();
  await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+$/);
  await expect(page.getByText(questionText)).toBeVisible();
}

/** Publish the given quiz (must be opened from its detail page). */
export async function publishQuiz(page: Page, quizTitle: string) {
  await page.goto("/en/admin/quizzes");
  await page.getByRole("link", { name: quizTitle }).click();
  await page.getByLabel("Status").selectOption({ label: "Published" });
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/quizzes\/?$/);
}

/** From a round detail page, open the new-question chooser for a type. */
export async function openQuestionForm(
  page: Page,
  roundUrl: string,
  typeCardName: string
) {
  await page.goto(roundUrl);
  await page.getByRole("link", { name: "+ Add question" }).click();
  await expect(page).toHaveURL(/\/questions\/new$/);
  // The chooser card's accessible name is "<name> <description>", so
  // match the name as a prefix rather than exact.
  await page
    .getByRole("link", {
      name: new RegExp(
        "^" + typeCardName.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")
      ),
    })
    .click();
}
