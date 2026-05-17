# Testing Strategy

Last updated: 2026-05-17

Meloman uses layered testing. The goal is not to test every implementation detail, but to protect the flows that would hurt a live quiz night if they broke.

## Current Automated Coverage

Jest currently covers:

- Admin metadata API route guards with mocked auth and mocked external providers.
- Live quiz grading logic.
- Pusher channel naming helpers.
- Countdown timer helpers and component behavior.
- Live presentation media components: blurred image reveal switching and audio clip player timer-bounded pause.
- Zod validation schemas for player answer inputs and question creation inputs.
- Translation key consistency between Bulgarian and English message files.
- Bilingual question overlay resolver + Mystery Artist daily-stage logic.

The **mobile** app has its own dependency-light ts-jest setup
(`pnpm --filter mobile test`, also in CI) for pure logic only —
`quizPalette` parity guard and the QR `parseJoinCode`. Component /
navigation tests need a device (Detox/Maestro) and are a documented
follow-up; Playwright stays web-only.

## What Jest Is For

Use Jest for:

- Pure functions.
- Zod schemas.
- Formatting helpers.
- Small React components that can be rendered in isolation.
- Regression tests for bugs that already happened.

Avoid using Jest for:

- Full browser navigation.
- Multi-tab real-time behavior.
- End-to-end host/player flows.

## What Manual QA Is For

Manual QA is still required for Stage 3 because live quiz behavior crosses browser tabs, server actions, Pusher events, and database state.

Use `docs/live-quiz-test-plan.md` for the current manual checklist.

## Playwright Coverage

Playwright clicks through the UI like a user. The suite is split into
two projects:

- **`smoke`** — DB-safe, no auth (public/auth pages, protected-route
  redirects, reset-password rejection). Runs in CI:

  ```bash
  pnpm --filter @meloman/web test:e2e
  ```

- **`full`** — authed, writes throwaway timestamped data to the dev DB.
  Local only:

  ```bash
  pnpm --filter @meloman/web test:e2e:full
  ```

Coverage is comprehensive (~40 tests): admin authoring (all 6 question
types, edit/delete, quiz edit, reorder, guest-video boundary), admin
content (daily, users, stories publish, analytics), auth
(register/login/logout), the full two-actor live game loop +
pause/resume + score-adjust + existing-team join + captain lock + host
override, and public content. The authoritative, always-current map
(and the deliberate exclusions: real R2/email uploads, 2-team cutoff
flake, Expo) lives in **`docs/backlog.md`**.

This is the right tool for "does the important button work in the
browser?" checks.

## Quality Gates

Before handing back substantial work:

```bash
pnpm --filter @meloman/web lint
pnpm --filter @meloman/web exec tsc --noEmit
pnpm --filter @meloman/web test
pnpm --filter @meloman/web test:e2e
pnpm --filter @meloman/web build
```

Coverage report:

```bash
pnpm --filter @meloman/web test:coverage
```

This prints a terminal coverage table and writes an ignored HTML/LCOV report to `apps/web/coverage/`.
