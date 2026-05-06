# Stage 3 Handoff: Live Quiz Engine

Last updated: 2026-05-06

## Current Status

Stage 3 is partially implemented and playable through the web app.

Completed core pieces:

- Pusher helpers with safe channel names (`quiz-{CODE}` instead of colon-separated names).
- Live quiz DB tables: sessions, teams, team members, answers.
- Host lobby route at `apps/web/app/[locale]/host/[code]`.
- Player join/lobby route at `apps/web/app/[locale]/play/[code]/lobby`.
- Team roster loading and player membership checks.
- Host controls for `Start`, `Reveal answer`, and `Next question`.
- State flow: `lobby -> active -> reveal -> finished`.
- Player answer submission for all six question types.
- Server-side grading helpers with Jest coverage.
- API route guard coverage with Jest for Spotify/Wikipedia metadata routes.
- Playwright smoke coverage for public/auth navigation, form validation, and anonymous admin redirect.
- Server-authoritative countdown UI using `questionEndsAt` and DB `now()`.
- Auto reveal when the active question timer expires.
- Player lobby refresh on Pusher `question-started`, `question-revealed`, and `session-finished`.
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

## Important Files

- Host actions: `apps/web/app/[locale]/host/[code]/actions.ts`
- Host page: `apps/web/app/[locale]/host/[code]/page.tsx`
- Host controls: `apps/web/app/[locale]/host/[code]/host-controls.tsx`
- Auto reveal effect: `apps/web/app/[locale]/host/[code]/auto-reveal-on-timeout.tsx`
- Host Pusher subscription: `apps/web/app/[locale]/host/[code]/live-host.tsx`
- Player lobby page: `apps/web/app/[locale]/play/[code]/lobby/page.tsx`
- Player answer panel: `apps/web/app/[locale]/play/[code]/lobby/question-panel.tsx`
- Player Pusher subscription: `apps/web/app/[locale]/play/[code]/lobby/live-lobby.tsx`
- Player answer action: `apps/web/app/[locale]/play/[code]/actions.ts`
- Grading logic: `apps/web/lib/live-quiz/grading.ts`
- Timer UI: `apps/web/components/live/timer-countdown.tsx`
- Pusher channel helpers: `apps/web/lib/pusher-channels.ts`
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

- Fullscreen host presentation route (`/host/session/[code]/present` or final agreed route).
- Keyboard controls for host presentation.
- Better host-side question rendering for all six types.
- Audio question playback from R2 signed URLs.
- Image reveal blur sync based on server timestamps.
- Live leaderboard and score broadcast.
- End-of-quiz podium.

Medium priority:

- Host override panel for disputed open-text answers.
- Answer count updates during active questions.
- Pause/resume timer state.
- Final round logic.
- Better player UI states after submit/reveal.

Polish:

- TV-friendly layout.
- Mobile viewport QA.
- Sponsor logo placement.
- Animation polish.

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

Implement the fullscreen host presentation route first. It is the biggest missing "wow moment" for Stage 3 and can reuse the current session state, question loading, timer, and Pusher refresh wiring.

## Repository Maintenance Note

Before continuing Stage 3, read `docs/repository-structure.md`. Keep new files in the existing route/module ownership boundaries, update docs when a documented flow changes, and avoid mixing unrelated cleanup into feature commits.
