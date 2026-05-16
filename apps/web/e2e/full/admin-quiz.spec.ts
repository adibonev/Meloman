import { expect, test } from "@playwright/test";

// Full quiz authoring happy path — the button-heavy flow Adi would
// otherwise click by hand: create quiz → publish → add round → add a
// multiple-choice question → start a live session → host lobby shows
// the join code + QR. Self-contained: a timestamped title keeps every
// run isolated and re-runnable against the dev DB.
test.describe("admin quiz authoring", () => {
  test("create quiz, round, question, then start a live session", async ({
    page,
  }) => {
    const quizTitle = `E2E Quiz ${Date.now()}`;

    // --- Create quiz ---
    await page.goto("/en/admin/quizzes");
    await page.getByRole("link", { name: "New quiz" }).click();
    await expect(page).toHaveURL(/\/en\/admin\/quizzes\/new/);
    await page.getByLabel("Title").fill(quizTitle);
    await page
      .getByLabel("Description (optional)")
      .fill("Created by Playwright e2e.");
    await page.getByRole("button", { name: "Create quiz" }).click();
    await expect(page).toHaveURL(/\/en\/admin\/quizzes\/?$/);

    // --- Open it, publish it ---
    await page.getByRole("link", { name: quizTitle }).click();
    await expect(page).toHaveURL(/\/en\/admin\/quizzes\/[0-9a-f-]+$/);
    await page.getByLabel("Status").selectOption({ label: "Published" });
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/\/en\/admin\/quizzes\/?$/);

    // --- Add a round ---
    await page.getByRole("link", { name: quizTitle }).click();
    await page.getByRole("link", { name: "+ Add round" }).click();
    await expect(page).toHaveURL(/\/rounds\/new/);
    await page.getByLabel("Round title").fill("Round 1");
    await page
      .getByLabel("How many teams advance after this round")
      .fill("0");
    await page.getByRole("button", { name: "Create round" }).click();
    // Round-create redirects back to the quiz detail; the new round
    // shows in the Rounds list — open it to add a question.
    await expect(page).toHaveURL(/\/en\/admin\/quizzes\/[0-9a-f-]+$/);
    await page.getByRole("link", { name: "Round 1" }).click();
    await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+$/);

    // --- Add a multiple-choice question ---
    await page.getByRole("link", { name: "+ Add question" }).click();
    await expect(page).toHaveURL(/\/questions\/new$/);
    await page.getByRole("link", { name: "Multiple Choice" }).click();
    await expect(page).toHaveURL(/\/questions\/new\/multiple-choice/);

    await page.getByLabel("Question text").fill("Who recorded 'Imagine'?");
    await page.getByLabel("Option A").fill("John Lennon");
    await page.getByLabel("Option B").fill("Paul McCartney");
    await page.getByLabel("Option C").fill("George Harrison");
    await page.getByLabel("Option D").fill("Ringo Starr");
    await page
      .locator('input[name="correctIndex"][value="0"]')
      .check();
    await page.getByLabel("Time limit (seconds)").fill("20");
    await page.getByLabel("Points for correct answer").fill("1");
    await page.getByRole("button", { name: "Create question" }).click();

    // Back on the round page, the question is listed.
    await expect(page).toHaveURL(/\/rounds\/[0-9a-f-]+$/);
    await expect(
      page.getByText("Who recorded 'Imagine'?")
    ).toBeVisible();

    // --- Start a live session from the quiz ---
    await page.getByRole("link", { name: "← Back to quiz" }).click();
    await expect(page).toHaveURL(/\/en\/admin\/quizzes\/[0-9a-f-]+$/);
    await page
      .getByRole("button", { name: "Start live session" })
      .click();

    // Host lobby: join code + scannable QR.
    await expect(page).toHaveURL(/\/en\/host\/[A-Z0-9]+$/);
    await expect(
      page.getByText("Join code", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Scan to join", { exact: true })
    ).toBeVisible();
    const code = page.url().split("/host/")[1];
    expect(code).toMatch(/^[A-Z0-9]{4,8}$/);
  });
});
