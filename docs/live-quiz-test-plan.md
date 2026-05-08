# Live Quiz Manual Test Plan

Last updated: 2026-05-09

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

## Host Presentation (fullscreen)

Open a second tab from the host lobby via "Open fullscreen presentation" — the URL is `/bg/host/{CODE}/present`.

- Header shows the join code in large type and the current status.
- During `lobby`, the join code dominates the screen so players can read it from across the venue.
- Pressing `SPACE` while the question is active reveals the answer.
- Pressing `SPACE` while the answer is revealed advances to the next question.
- Pressing `P` while active pauses the session and freezes the remaining timer.
- Pressing `P` while paused resumes the session with the same remaining time.
- Pressing `L` toggles the leaderboard overlay.
- Pressing `ESC` closes the leaderboard overlay if it is open.
- The footer shows the keyboard hints, "Working..." while a server action runs, and the most recent error key (if any).
- Refreshing the presentation page during an active question continues the timer from the real remaining time.

### Audio Question

- During `active`, the MP3 plays from a Cloudflare R2 signed URL (no public download exposed).
- If the answer timer is shorter than the clip, playback stops at the timer end (silence is not added; it is cut).
- If the clip is shorter than the timer, the clip ends naturally and the rest of the timer is silence — playback does not loop.
- On `reveal`, audio is paused.
- If autoplay is blocked by the browser, a fallback `<audio controls>` element appears so the host can press play once and the same component will start the next clip cleanly.

### Image Reveal Question

- During `active`, the image is shown with a heavy static blur (no progressive un-blur).
- On `reveal`, the image transitions to no blur over ~600ms and the attribution caption appears underneath if present.
- Refreshing the page during reveal still shows the un-blurred image.

### Leaderboard Overlay

- `L` opens an overlay with teams sorted by total score, descending.
- Clicking outside the overlay closes it.
- The "Close" button and `ESC` also close the overlay.
- Submitting an answer broadcasts `scores-updated` over Pusher; the host page refreshes and the overlay reflects the new score the next time it is opened (or stays current if it was already open during the refresh).

### Host Answer Override

- During reveal (or paused-from-reveal), the host lobby shows answer override controls for open-text, audio, and image-reveal answers.
- Each row exposes both an "Accept" and a "Reject" button. The currently selected state is solid, the alternative is outlined.
- Clicking the alternative flips the answer's `is_correct`, recomputes `points_awarded`, sets `host_override = true`, and adjusts the team's `total_score` by the delta.
- The override action broadcasts `scores-updated`, and both host lobby and presentation leaderboard reflect the new total after refresh.
- Override controls are not shown for multiple-choice, lyric-blank, or decade questions yet.

### Per-round Advancement and Between-rounds Slide

- Quiz with at least two rounds and at least one round whose `advancement_top_n > 0` is required to exercise this flow.
- After the last question of a round reveals, clicking "Next question" puts the session into `between_rounds` instead of starting the next question immediately.
- Host TV (`/host/{CODE}/present`) renders the leaderboard slide; player phones show the same standings with a row highlighting the player's team.
- Pressing `SPACE` (or clicking "Start next round") on the host applies the previous round's cutoff: the bottom teams flip to `is_active = false` and the first question of the next round starts.
- Eliminated players see "Not advancing" on their phone and the captain's submit is disabled. The server also rejects the submit with `eliminated` if the client is bypassed.
- Refreshing the host or a player phone during `between_rounds` keeps showing the leaderboard slide; no question content leaks.
- A round with `advancement_top_n = 0` (or empty admin form) leaves every active team continuing.

### End-of-quiz Podium

- After the last reveal, clicking "Next question" finishes the session.
- Host TV shows the top 3 teams in podium layout (gold center, silver left, bronze right) with the rest listed below.
- Player phones show "Quiz finished" copy.

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
pnpm --filter @meloman/web test:e2e
pnpm --filter @meloman/web build
```

For active development:

```bash
pnpm test:watch
```
