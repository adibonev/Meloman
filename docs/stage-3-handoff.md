# Stage 3 Handoff: Live Quiz Engine

Last updated: 2026-05-08

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
- Image reveal questions render a static heavy-blur image during `active`, un-blur on `reveal`, and show attribution after reveal.
- Live leaderboard overlay rendered from server-loaded team scores; refreshes via Pusher `scores-updated` so points stay current as answers come in.
- End-of-quiz podium component and ranking helpers.
- State flow: `lobby -> active -> reveal -> finished`, with optional `paused` state from `active` or `reveal`.
- Player answer submission for all six question types.
- Server-side grading helpers with Jest coverage.
- API route guard coverage with Jest for Spotify/Wikipedia metadata routes.
- Playwright smoke coverage for public/auth navigation, form validation, and anonymous admin redirect.
- Server-authoritative countdown UI using `questionEndsAt` and DB `now()`.
- Auto reveal when the active question timer expires.
- Player lobby refresh on Pusher `question-started`, `question-revealed`, and `session-finished`.
- Jest coverage for the new presentation media components: `BlurredImage` blur on/off and `AudioClipPlayer` timer-bounded pause.
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
7. Session becomes `reveal`, correct answer is shown.
8. Host manually clicks `Next question`.
9. Next question becomes `active`.
10. After the final reveal, `Next question` finishes the session.

The next question is intentionally host-controlled after reveal. Do not auto-advance immediately unless the product decision changes, because real quiz nights need reveal/comment/override time.

## Remaining Stage 3 Work

High priority:

- Better host-side question rendering for lyric_blank and decade types on the presentation route (currently the question text shows but per-blank/per-year hints are minimal).

Medium priority:

- Final round logic.
- Better player UI states after submit/reveal.

Polish:

- TV-friendly layout refinement.
- Mobile viewport QA.
- Sponsor logo placement on the presentation footer.
- Animation polish (Framer Motion for reveal/podium). The podium component exists; the remaining work is motion/TV polish.

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

Improve the presentation rendering for `lyric_blank` and `decade`, then continue with final-round logic and player post-submit/reveal polish. Pause/resume and host answer override are already in `5f2d5b6`; do not rebuild them unless a concrete bug is found.

## Repository Maintenance Note

Before continuing Stage 3, read `docs/repository-structure.md`. Keep new files in the existing route/module ownership boundaries, update docs when a documented flow changes, and avoid mixing unrelated cleanup into feature commits.
