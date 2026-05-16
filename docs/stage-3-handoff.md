# Stage 3 Handoff: Live Quiz Engine

Last updated: 2026-05-09

## Current Status

Stage 3 is partially implemented and playable through the web app.

Completed core pieces:

- Pusher helpers with safe channel names (`quiz-{CODE}` instead of colon-separated names).
- Live quiz DB tables: sessions, teams, team members, answers.
- Host lobby route at `apps/web/app/[locale]/host/[code]`.
- Fullscreen host presentation route at `apps/web/app/[locale]/host/[code]/present`.
- Player join/lobby route at `apps/web/app/[locale]/play/[code]/lobby`.
- Team roster loading and player membership checks.
- Host controls for `Start`, `Reveal answer`, and `Next question`.
- Keyboard controls on the presentation route: `SPACE` advances the flow, `P` pauses/resumes, `L` toggles the leaderboard overlay, `ESC` closes the overlay.
- Pause/resume timer state, including DB-backed `pausedAt` / `pausedFromStatus` and timer shifting on resume.
- Host override panel for disputed open-text, audio, and image-reveal answers during reveal.
- Audio playback for audio questions, served from R2 signed URLs, bounded by the answer timer (clip stops when the timer ends).
- Image reveal questions render a static heavy-blur image during `active`, un-blur on `reveal`, and show attribution after reveal. Blur radius is admin-configurable per question (`questions.media_blur_px`, 2-80px).
- Live leaderboard overlay rendered from server-loaded team scores; refreshes via Pusher `scores-updated` so points stay current as answers come in.
- End-of-quiz podium component and ranking helpers.
- Per-round advancement criteria (`rounds.advancement_top_n`): admin sets how many teams continue after each round. The bottom teams flip to `teams.is_active = false` and are locked out of subsequent submits.
- `between_rounds` session status: between two rounds the session pauses on a leaderboard slide. Host clicks "Start next round" (or `SPACE`) to apply the cutoff and start the next round. Both host TV (`BetweenRoundsLeaderboard`) and player phones show the standings; eliminated teams see a "not advancing" notice.
- Host override panel for disputed open-text, audio, and image-reveal answers during reveal — accept / reject toggle, recomputes team total_score, marks `host_override`.
- Scannable join QR on the host lobby and presentation lobby (`qrcode.react`, points at `/play/[code]` built from the request origin) so players join by camera instead of typing the code.
- Host manual score adjustment on the between-rounds slide: a `−/+` stepper per team, committed once, writes `teams.total_score` (clamped at 0, ±100 bound) and broadcasts `scores-updated`.
- Guest-host MP4 final round: admin attaches an MP4 to a `final` round (R2, ≤30 MB); the presentation shows a host-triggered "Guest video" control that plays it fullscreen on the TV. Host-triggered by design so playback never races the server-authoritative timer.
- Decade question UX: player year input is constrained to the selected decade range; server schema rejects mismatched year/decade pairs.
- Max team size per quiz: admin sets the cap on the quiz detail form, player team picker shows full teams, and `joinTeamAction` enforces the cap server-side.
- State flow: `lobby -> active -> reveal -> (between_rounds ->) active -> ... -> finished`, with optional `paused` state from `active` or `reveal`.
- Player answer submission for all six question types.
- Server-side grading helpers with Jest coverage.
- API route guard coverage with Jest for Spotify/Wikipedia metadata routes.
- Playwright smoke coverage for public/auth navigation, form validation, and anonymous admin redirect.
- Server-authoritative countdown UI using `questionEndsAt` and DB `now()`.
- Auto reveal when the active question timer expires.
- Player lobby refresh on Pusher `question-started`, `question-revealed`, and `session-finished`.
- Jest coverage for the new presentation media components: `BlurredImage` blur on/off and `AudioClipPlayer` timer-bounded pause.
- Sponsor management polish: admins can upload logos to R2, edit/delete sponsors, assign one or more sponsors to a quiz, and the host presentation footer renders sponsor logos/names.
- Host presentation renders lyric blanks with TV-sized blank slots, reveal-time answer order chips, and per-blank scoring metadata; decade/year questions show separate decade and exact-year scoring cards.
- Player post-submit/reveal polish: after submit the team sees an "answer locked" state, reveal screens show the result plus a next-question hint, and question form state resets cleanly on the next question remount.
- Root Jest scripts, including watch mode.
- Root and web Playwright scripts for browser-level regression checks.
- Current web lint is clean.

Recent Stage 3 commits:

- `160f0c0 feat(db, web): live-quiz schemas and Pusher helpers`
- `b2f5db3 feat(web): live quiz lobby and answer flow`
- `09649a8 feat(web): grade all live question types`
- `83af12d test(web): add Jest setup for live quiz grading`
- `55baeec fix(web): use Pusher-safe live quiz channels`
- `f29bb5a test(web): add root Jest watch script`
- `f6a29c4 feat(web): add live quiz countdown timer`
- `051fe52 fix(web): reveal live questions when timer expires`
- `9b4eace chore(web): clean admin form lint warnings`
- `5f2d5b6 feat(db, web): add live quiz presentation flow`

## Important Files

- Host actions: `apps/web/app/[locale]/host/[code]/actions.ts`
- Host page: `apps/web/app/[locale]/host/[code]/page.tsx`
- Host controls: `apps/web/app/[locale]/host/[code]/host-controls.tsx`
- Host override panel: `apps/web/app/[locale]/host/[code]/answer-override-panel.tsx`
- Auto reveal effect: `apps/web/app/[locale]/host/[code]/auto-reveal-on-timeout.tsx`
- Host Pusher subscription: `apps/web/app/[locale]/host/[code]/live-host.tsx`
- Fullscreen presentation page: `apps/web/app/[locale]/host/[code]/present/page.tsx`
- Presentation shell (keyboard + leaderboard overlay state): `apps/web/app/[locale]/host/[code]/present/presentation-shell.tsx`
- Audio clip player: `apps/web/components/live/audio-clip-player.tsx`
- Blurred image reveal: `apps/web/components/live/blurred-image.tsx`
- Leaderboard overlay: `apps/web/components/live/leaderboard-overlay.tsx`
- Between-rounds leaderboard slide: `apps/web/components/live/between-rounds-leaderboard.tsx`
- Podium: `apps/web/components/live/podium.tsx`
- Player lobby page: `apps/web/app/[locale]/play/[code]/lobby/page.tsx`
- Player answer panel: `apps/web/app/[locale]/play/[code]/lobby/question-panel.tsx`
- Player Pusher subscription: `apps/web/app/[locale]/play/[code]/lobby/live-lobby.tsx`
- Player answer action: `apps/web/app/[locale]/play/[code]/actions.ts`
- Grading logic: `apps/web/lib/live-quiz/grading.ts`
- Timer UI: `apps/web/components/live/timer-countdown.tsx`
- Pusher channel helpers: `apps/web/lib/pusher-channels.ts`
- R2 signed URL helpers: `apps/web/lib/r2.ts`
- Testing strategy: `docs/testing-strategy.md`
- Ready-to-use Claude prompt: `docs/claude-stage-3-prompt.md`

## Current Intended Flow

1. Host opens `/bg/host/{CODE}`.
2. Players join through `/bg/play/{CODE}` and enter the lobby.
3. Host clicks `Start`.
4. Session becomes `active`, first question is shown, timer starts.
5. Captain submits the team answer.
6. When time expires, host page auto-calls `revealAnswerAction`.
7. Session becomes `reveal`, correct answer is shown. The host override panel is available here for open-text / audio / image-reveal questions.
8. Host manually clicks `Next question`.
9. If the next question is in the SAME round, it becomes `active` immediately. If it lives in a DIFFERENT round, the session enters `between_rounds` and shows the leaderboard slide; the host clicks "Start next round" (or `SPACE`) to apply the previous round's `advancement_top_n` cutoff and start the new round.
10. After the final reveal, `Next question` finishes the session and the podium renders.

The next question is intentionally host-controlled after reveal. Do not auto-advance immediately unless the product decision changes, because real quiz nights need reveal/comment/override time.

## Remaining Stage 3 Work

Polish:

- TV-friendly layout refinement.
- Mobile viewport QA.
- Animation polish (Framer Motion for reveal / podium / between-rounds slide).
- Drop the legacy `teams.is_finalist` and `quizzes.final_round_top_n` columns once the per-round model has soaked.

## Known Product Decisions

- Pusher channel names must stay Pusher-safe: letters, numbers, underscores, hyphens.
- DB writes are the source of truth; failed Pusher broadcasts should not throw runtime overlays.
- Only team captains can submit answers.
- Time checks happen server-side in `submitAnswerAction`.
- Timer UI can count down on the client, but timing authority is `questionEndsAt` from the DB.
- User-facing strings must go through `next-intl`.
- Keep TypeScript strict and avoid `any`.

## Verification Commands

Run before handing work back:

```bash
pnpm --filter @meloman/web lint
pnpm --filter @meloman/web exec tsc --noEmit
pnpm --filter @meloman/web test
pnpm --filter @meloman/web test:e2e
pnpm --filter @meloman/web build
```

For watch mode while coding:

```bash
pnpm test:watch
```

## Suggested Next Step

Pick one of the polish items: TV/mobile layout QA or animation polish before the SoftUni defense.

Pause/resume, host override, per-round cutoff, between-rounds leaderboard, and podium are all shipped — do not rebuild them unless a concrete bug is found.

## Repository Maintenance Note

Before continuing Stage 3, read `docs/repository-structure.md`. Keep new files in the existing route/module ownership boundaries, update docs when a documented flow changes, and avoid mixing unrelated cleanup into feature commits.
