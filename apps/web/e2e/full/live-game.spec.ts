import { expect, test } from "@playwright/test";
import { ADMIN_STATE, PLAYER_STATE } from "../auth-paths";
import {
  addMcQuestion,
  createQuizWithRound,
  publishQuiz,
  uniqueTitle,
} from "./_helpers";

// The core of the app: a real two-actor game. The host (admin context)
// authors + runs a one-question quiz; the player (separate context)
// joins a team, answers, and sees the reveal + finish. Cross-context
// updates ride Pusher or the §5.4 polling fallback, so the player-side
// waits use generous timeouts.
test.describe("live game loop", () => {
  test("host runs a question, player answers, reveal, finish", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    const hostCtx = await browser.newContext({ storageState: ADMIN_STATE });
    const playerCtx = await browser.newContext({
      storageState: PLAYER_STATE,
    });
    const host = await hostCtx.newPage();
    const player = await playerCtx.newPage();

    try {
      // --- Host authors + publishes a one-question quiz ---
      const quizTitle = uniqueTitle("E2E Live");
      const roundUrl = await createQuizWithRound(host, quizTitle);
      await addMcQuestion(host, roundUrl, "Pick the right one");
      await publishQuiz(host, quizTitle);

      await host.goto("/en/admin/quizzes");
      await host.getByRole("link", { name: quizTitle }).click();
      await host
        .getByRole("button", { name: "Start live session" })
        .click();
      await expect(host).toHaveURL(/\/en\/host\/[A-Z0-9]+$/);
      const code = host.url().split("/host/")[1];

      // --- Player joins, creates a team (becomes captain) ---
      await player.goto(`/en/play/${code}`);
      await player
        .getByPlaceholder("e.g. The Melomaniacs")
        .fill("E2E Team");
      await player.getByRole("button", { name: "Create team" }).click();
      await expect(player).toHaveURL(
        new RegExp(`/play/${code}/lobby`)
      );
      await expect(
        player.getByText("Waiting for the host")
      ).toBeVisible({ timeout: 15_000 });

      // --- Host starts → player gets the question ---
      await host.getByRole("button", { name: "Start", exact: true }).click();
      await expect(
        player.getByText("Pick the right one")
      ).toBeVisible({ timeout: 20_000 });

      // Captain submits the correct option.
      await player
        .getByRole("button", { name: "Right", exact: true })
        .click();
      await expect(
        player.getByText("Answer locked in")
      ).toBeVisible({ timeout: 15_000 });

      // --- Host reveals → player sees the correct result ---
      await host
        .getByRole("button", { name: "Reveal answer" })
        .click();
      await expect(player.getByText("✓ Correct!")).toBeVisible({
        timeout: 20_000,
      });

      // --- Host advances past the only question → session finishes ---
      await host
        .getByRole("button", { name: "Next question" })
        .click();
      await expect(
        player.getByText("Quiz finished.")
      ).toBeVisible({ timeout: 20_000 });
    } finally {
      await hostCtx.close();
      await playerCtx.close();
    }
  });
});
