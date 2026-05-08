# Testing Strategy

Last updated: 2026-05-08

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

Playwright covers browser-level regression tests that click through the UI like a user. The current suite starts with public/auth smoke coverage and should grow as Stage 3 stabilizes.

Run it with:

```bash
pnpm --filter @meloman/web test:e2e
```

Current Playwright coverage:

- Home page CTAs navigate to login/register.
- Login and register forms show client-side validation.
- Anonymous users are redirected away from protected admin routes.

Next Playwright targets:

- Host creates/opens a session.
- Player joins a team.
- Host starts question.
- Captain submits answer.
- Timer expires.
- Answer is revealed.
- Host moves to next question.

This is the right tool for "does the important button work in the browser?" checks.

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
