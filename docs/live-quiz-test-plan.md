# Live Quiz Manual Test Plan

Last updated: 2026-05-04

Use this checklist when testing Stage 3 live quiz behavior locally.

## Setup

1. Start the web app:

   ```bash
   pnpm --filter @meloman/web dev
   ```

2. Open one browser tab as the host:

   ```text
   /bg/host/{CODE}
   ```

3. Open one or more player tabs, preferably in another browser or private window:

   ```text
   /bg/play/{CODE}
   ```

4. Make sure the quiz has at least one question and at least one team with a captain.

## Host Flow

- Host page loads the quiz title and join code.
- Team roster updates after players join.
- `Start` moves the session from lobby to active.
- Current question appears after start.
- Countdown timer appears while the question is active.
- When the timer reaches zero, the session auto-reveals the answer.
- `Next question` appears after reveal.
- `Next question` starts the next question and a new timer.
- After the final question reveal, `Next question` finishes the session.

## Player Flow

- Player can join a team and reach the lobby.
- Player sees team name, members, and captain badge.
- When host starts, player page refreshes to the active question.
- Only the captain can submit.
- Non-captains see the question but cannot submit.
- After captain submits, the page shows submitted state.
- After reveal, player sees the correct answer.
- On next question, answer controls reset for the new question.

## Timer Behavior

- Refresh host/player page during an active question.
- Timer should continue from the real remaining time, not restart.
- Submitting after the timer expires should be rejected.
- Timer should disappear in reveal state.
- Host should not need manual refresh when timer expires.
- Player should not need manual refresh when answer is revealed.

## Question Types

Test one example of each type:

- Multiple choice: choose one option, verify correct/incorrect grading.
- Open text: submit exact answer and near-match answer.
- Audio: submit text answer while audio question is active.
- Image reveal: submit text answer while reveal question is active.
- Lyric blank: submit all blanks, verify per-blank score.
- Decade/year: submit decade and year, verify partial scoring.

## Pusher Behavior

- Joining teams should update host roster without reload.
- Starting a question should refresh player tabs.
- Revealing an answer should refresh player tabs.
- Finishing the session should refresh player tabs.
- No runtime overlay should appear if a broadcast fails; DB state is the source of truth.

## Regression Checks

- No `Invalid channel name` error appears.
- No duplicate answer can be submitted by the same team for one question.
- A captain from one team cannot submit for another team.
- A player outside the session cannot submit.
- Refreshing the browser does not change score or session state.
- All visible user-facing strings are localized.

## Automated Checks

Run these before considering a live quiz change done:

```bash
pnpm --filter @meloman/web lint
pnpm --filter @meloman/web exec tsc --noEmit
pnpm --filter @meloman/web test
pnpm --filter @meloman/web build
```

For active development:

```bash
pnpm test:watch
```
