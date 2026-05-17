import { expect, test } from "@playwright/test";
import { ADMIN_STATE, PLAYER_STATE } from "../auth-paths";
import {
  createQuizWithRound,
  addMcQuestion,
  openQuestionForm,
  publishQuiz,
  uniqueTitle,
} from "./_helpers";

// Live-game depth the single happy-path loop skips: a second player
// joining an *existing* team (anonymous join), the captain-only submit
// lock for non-captains (§4.3), the wrong-answer reveal banner, and the
// host manual-override (§4.5/§3.4) accepting a fuzzy-missed open answer.
//
// Deliberately deferred (documented in docs/backlog.md): the 2-team
// per-round cutoff → eliminated→spectator path. It needs two parallel
// player contexts in separate teams plus advancement timing across
// Pusher — high flake for low marginal coverage, same risk policy as
// the R2/email exclusions.
test.describe("live game depth", () => {
  test("second player joins an existing team, can't submit, sees the wrong-answer reveal", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    const hostCtx = await browser.newContext({ storageState: ADMIN_STATE });
    const capCtx = await browser.newContext({ storageState: PLAYER_STATE });
    // Explicit empty state: the full project sets a default admin
    // storageState, which a bare newContext() would inherit — we need a
    // genuinely signed-out context for the anonymous join path.
    const memCtx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const host = await hostCtx.newPage();
    const captain = await capCtx.newPage();
    const member = await memCtx.newPage();

    try {
      const quizTitle = uniqueTitle("E2E Depth");
      const roundUrl = await createQuizWithRound(host, quizTitle);
      await addMcQuestion(host, roundUrl, "Pick the loser");
      await publishQuiz(host, quizTitle);

      await host.goto("/en/admin/quizzes");
      await host.getByRole("link", { name: quizTitle }).click();
      await host
        .getByRole("button", { name: "Start live session" })
        .click();
      await expect(host).toHaveURL(/\/en\/host\/[A-Z0-9]+$/);
      const code = host.url().split("/host/")[1];

      // Captain creates the team.
      await captain.goto(`/en/play/${code}`);
      await captain
        .getByPlaceholder("e.g. The Melomaniacs")
        .fill("E2E TeamX");
      await captain.getByRole("button", { name: "Create team" }).click();
      await expect(captain).toHaveURL(new RegExp(`/play/${code}/lobby`));

      // Member: anonymous name → team selection → join the existing team.
      await member.goto(`/en/play/${code}`);
      await member.getByLabel("Your name").fill("Member Two");
      await member.getByRole("button", { name: "Join quiz" }).click();
      await member
        .getByRole("button")
        .filter({ hasText: "E2E TeamX" })
        .click();
      await expect(member).toHaveURL(new RegExp(`/play/${code}/lobby`));
      await expect(
        member.getByText("Waiting for the host")
      ).toBeVisible({ timeout: 15_000 });

      // Host starts → both see the question.
      await host
        .getByRole("button", { name: "Start", exact: true })
        .click();
      await expect(
        captain.getByText("Pick the loser")
      ).toBeVisible({ timeout: 20_000 });
      await expect(
        member.getByText("Pick the loser")
      ).toBeVisible({ timeout: 20_000 });

      // Non-captain is locked out: hint shown + options disabled.
      await expect(
        member.getByText("Only the team captain can submit an answer.")
      ).toBeVisible();
      await expect(
        member.getByRole("button", { name: "Wrong 1", exact: true })
      ).toBeDisabled();

      // Captain submits a wrong option.
      await captain
        .getByRole("button", { name: "Wrong 1", exact: true })
        .click();
      await expect(
        captain.getByText("Answer locked in")
      ).toBeVisible({ timeout: 15_000 });

      // Reveal → both teammates see the wrong-answer banner.
      await host
        .getByRole("button", { name: "Reveal answer" })
        .click();
      await expect(
        captain.getByText("✗ Wrong answer")
      ).toBeVisible({ timeout: 20_000 });
      await expect(
        member.getByText("✗ Wrong answer")
      ).toBeVisible({ timeout: 20_000 });

      // Advance past the only question → finished.
      await host
        .getByRole("button", { name: "Next question" })
        .click();
      await expect(
        captain.getByText("Quiz finished.")
      ).toBeVisible({ timeout: 20_000 });
    } finally {
      await hostCtx.close();
      await capCtx.close();
      await memCtx.close();
    }
  });

  test("host override accepts a fuzzy-missed open-text answer", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    const hostCtx = await browser.newContext({ storageState: ADMIN_STATE });
    const capCtx = await browser.newContext({ storageState: PLAYER_STATE });
    const host = await hostCtx.newPage();
    const captain = await capCtx.newPage();

    try {
      const quizTitle = uniqueTitle("E2E Override");
      const roundUrl = await createQuizWithRound(host, quizTitle);

      await openQuestionForm(host, roundUrl, "Open text");
      await host
        .getByLabel("Question text")
        .fill("Who recorded Bohemian Rhapsody?");
      await host.getByLabel("Accepted answers").fill("Queen");
      await host.getByRole("button", { name: "Create question" }).click();
      await expect(host).toHaveURL(/\/rounds\/[0-9a-f-]+$/);

      await publishQuiz(host, quizTitle);
      await host.goto("/en/admin/quizzes");
      await host.getByRole("link", { name: quizTitle }).click();
      await host
        .getByRole("button", { name: "Start live session" })
        .click();
      await expect(host).toHaveURL(/\/en\/host\/[A-Z0-9]+$/);
      const code = host.url().split("/host/")[1];

      await captain.goto(`/en/play/${code}`);
      await captain
        .getByPlaceholder("e.g. The Melomaniacs")
        .fill("E2E OT");
      await captain.getByRole("button", { name: "Create team" }).click();
      await expect(captain).toHaveURL(new RegExp(`/play/${code}/lobby`));

      await host
        .getByRole("button", { name: "Start", exact: true })
        .click();
      await expect(
        captain.getByText("Who recorded Bohemian Rhapsody?")
      ).toBeVisible({ timeout: 20_000 });

      // Captain submits a wrong answer the fuzzy matcher won't save.
      await captain.locator("#text-answer").fill("The Beatles");
      await captain
        .getByRole("button", { name: "Submit answer" })
        .click();
      await expect(
        captain.getByText("Answer locked in")
      ).toBeVisible({ timeout: 15_000 });

      // Host reveals → the manual-review panel appears.
      await host
        .getByRole("button", { name: "Reveal answer" })
        .click();
      await expect(
        host.getByRole("heading", { name: "Manual review" })
      ).toBeVisible({ timeout: 15_000 });

      const accept = host.getByRole("button", { name: "Accept" });
      const reject = host.getByRole("button", { name: "Reject" });
      // Auto-graded wrong: Accept actionable, Reject is the current state.
      await expect(accept).toBeEnabled();
      await accept.click();

      // After the override the answer is correct: Accept locks, the row
      // reports the accepted state.
      await expect(accept).toBeDisabled({ timeout: 15_000 });
      await expect(reject).toBeEnabled();
      await expect(host.getByText(/accepted/)).toBeVisible();
    } finally {
      await hostCtx.close();
      await capCtx.close();
    }
  });

  test("captain can transfer the role to a teammate in the lobby", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    const hostCtx = await browser.newContext({ storageState: ADMIN_STATE });
    const capCtx = await browser.newContext({ storageState: PLAYER_STATE });
    const memCtx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const host = await hostCtx.newPage();
    const captain = await capCtx.newPage();
    const member = await memCtx.newPage();

    try {
      const quizTitle = uniqueTitle("E2E Captain");
      const roundUrl = await createQuizWithRound(host, quizTitle);
      await addMcQuestion(host, roundUrl, "Captaincy question");
      await publishQuiz(host, quizTitle);

      await host.goto("/en/admin/quizzes");
      await host.getByRole("link", { name: quizTitle }).click();
      await host
        .getByRole("button", { name: "Start live session" })
        .click();
      await expect(host).toHaveURL(/\/en\/host\/[A-Z0-9]+$/);
      const code = host.url().split("/host/")[1];

      // Captain creates the team.
      await captain.goto(`/en/play/${code}`);
      await captain
        .getByPlaceholder("e.g. The Melomaniacs")
        .fill("E2E CapTeam");
      await captain.getByRole("button", { name: "Create team" }).click();
      await expect(captain).toHaveURL(new RegExp(`/play/${code}/lobby`));

      // Member joins the same team via the anonymous path.
      await member.goto(`/en/play/${code}`);
      await member.getByLabel("Your name").fill("Future Captain");
      await member.getByRole("button", { name: "Join quiz" }).click();
      await member
        .getByRole("button")
        .filter({ hasText: "E2E CapTeam" })
        .click();
      await expect(member).toHaveURL(new RegExp(`/play/${code}/lobby`));

      // Captain sees a "Make captain" control for the new member and
      // the Captain badge currently on their own row.
      await captain.reload();
      const memberRow = captain
        .getByRole("listitem")
        .filter({ hasText: "Future Captain" });
      await expect(
        memberRow.getByRole("button", { name: "Make captain" })
      ).toBeVisible({ timeout: 15_000 });

      // Transfer the role.
      await memberRow.getByRole("button", { name: "Make captain" }).click();

      // The badge moved: the member row now shows Captain, and the
      // current user (no longer captain) has no transfer buttons left.
      await expect(
        memberRow.getByText("Captain", { exact: true })
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        captain.getByRole("button", { name: "Make captain" })
      ).toHaveCount(0);
    } finally {
      await hostCtx.close();
      await capCtx.close();
      await memCtx.close();
    }
  });
});
