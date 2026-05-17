import { expect, test } from "@playwright/test";
import { ADMIN_STATE, PLAYER_STATE } from "../auth-paths";
import {
  addMcQuestion,
  createQuizWithRound,
  createTwoRoundQuiz,
  publishQuiz,
  uniqueTitle,
} from "./_helpers";

// Host-side controls that aren't exercised by the single-question live
// loop: pause/resume (server-authoritative timer freeze, §4.4) and the
// between-rounds manual score correction (feature D). Pause/resume is
// single-actor and deterministic; the score-adjust path needs a real
// team + a two-round quiz to reach the between_rounds state.
test.describe("host controls", () => {
  test("host can pause and resume a running session", async ({ page }) => {
    const title = uniqueTitle("E2E Pause");
    const roundUrl = await createQuizWithRound(page, title);
    await addMcQuestion(page, roundUrl, "Pausable question?");
    await publishQuiz(page, title);

    await page.goto("/en/admin/quizzes");
    await page.getByRole("link", { name: title }).click();
    await page.getByRole("button", { name: "Start live session" }).click();
    await expect(page).toHaveURL(/\/en\/host\/[A-Z0-9]+$/);

    // lobby → active
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Reveal answer" })
    ).toBeVisible();

    // active → paused
    await page.getByRole("button", { name: "Pause" }).click();
    await expect(
      page.getByRole("button", { name: "Resume" })
    ).toBeVisible();

    // paused → active (timer shifted server-side; Reveal is back)
    await page.getByRole("button", { name: "Resume" }).click();
    await expect(
      page.getByRole("button", { name: "Reveal answer" })
    ).toBeVisible();
  });

  test("host adjusts a team's score between rounds", async ({ browser }) => {
    test.setTimeout(120_000);

    const hostCtx = await browser.newContext({ storageState: ADMIN_STATE });
    const playerCtx = await browser.newContext({
      storageState: PLAYER_STATE,
    });
    const host = await hostCtx.newPage();
    const player = await playerCtx.newPage();

    try {
      // Two rounds, one MC question each — the round-1→round-2 hop is
      // what puts the session into between_rounds.
      const quizTitle = uniqueTitle("E2E Adjust");
      await createTwoRoundQuiz(host, quizTitle, "R1 question?", "R2 question?");
      await publishQuiz(host, quizTitle);

      await host.goto("/en/admin/quizzes");
      await host.getByRole("link", { name: quizTitle }).click();
      await host
        .getByRole("button", { name: "Start live session" })
        .click();
      await expect(host).toHaveURL(/\/en\/host\/[A-Z0-9]+$/);
      const code = host.url().split("/host/")[1];

      // Player only needs to create the team so the panel has a row;
      // they don't answer, so the team's starting score is a clean 0
      // (no Kahoot-speed scoring to reason about).
      await player.goto(`/en/play/${code}`);
      await player
        .getByPlaceholder("e.g. The Melomaniacs")
        .fill("E2E Team");
      await player.getByRole("button", { name: "Create team" }).click();
      await expect(player).toHaveURL(new RegExp(`/play/${code}/lobby`));
      await expect(
        player.getByText("Waiting for the host")
      ).toBeVisible({ timeout: 15_000 });

      // Host plays round 1 alone: lobby → active → reveal →
      // between_rounds (next question lives in round 2).
      await host.getByRole("button", { name: "Start", exact: true }).click();
      await host
        .getByRole("button", { name: "Reveal answer" })
        .click();
      await host
        .getByRole("button", { name: "Next question" })
        .click();

      const scorePanel = host.locator("section", {
        has: host.getByRole("heading", {
          name: "Manual score correction",
        }),
      });
      await expect(scorePanel).toBeVisible({ timeout: 15_000 });

      const teamRow = scorePanel.locator("li", { hasText: "E2E Team" });
      const scoreValue = teamRow
        .locator("span.font-heading.tabular-nums")
        .first();
      await expect(scoreValue).toHaveText("0");

      // Build a +5 delta, commit once.
      for (let i = 0; i < 5; i++) {
        await teamRow
          .getByRole("button", { name: "Increase by 1" })
          .click();
      }
      await expect(teamRow.locator("span.w-10")).toHaveText("+5");
      await teamRow.getByRole("button", { name: "Apply" }).click();

      // After the server action + refresh the delta resets and the
      // persisted total reflects the correction.
      await expect(scoreValue).toHaveText("5", { timeout: 15_000 });
    } finally {
      await hostCtx.close();
      await playerCtx.close();
    }
  });
});
