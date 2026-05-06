# Contributing

Meloman is a SoftUni capstone project and a real product, so changes should be small, reviewable, and easy to explain.

## Before You Start

Read these first:

- `README.md`
- `CLAUDE.md`
- `AGENTS.md`
- `docs/repository-structure.md`

For Sprint 3 live quiz work, also read:

- `docs/stage-3-handoff.md`
- `docs/live-quiz-test-plan.md`
- `docs/testing-strategy.md`

## Branch and Commit Style

Use focused branches and Conventional Commits:

- `feat(web): add host presentation route`
- `fix(web): prevent duplicate team submissions`
- `test(web): cover answer schema validation`
- `docs: update live quiz test plan`
- `chore(web): clean lint warnings`

Keep one concept per commit. Avoid mixing feature code, unrelated cleanup, and documentation unless the change is intentionally small and connected.

## Quality Gates

Run these before opening a PR or handing work back:

```bash
pnpm --filter @meloman/web lint
pnpm --filter @meloman/web exec tsc --noEmit
pnpm --filter @meloman/web test
pnpm --filter @meloman/web test:e2e
pnpm --filter @meloman/web build
```

Use watch mode while coding:

```bash
pnpm test:watch
```

## Code Standards

- TypeScript only.
- No `any`; use `unknown` and narrow with type guards.
- Server Components by default.
- Use Server Actions for mutations when possible.
- User-facing strings belong in `apps/web/messages/bg.json` and `apps/web/messages/en.json`.
- Keep Pusher channel names Pusher-safe: `quiz-{CODE}`, `quiz-{CODE}-host`, `presence-team-{TEAM_ID}`.
- Do not add forbidden libraries listed in `CLAUDE.md`.

## Documentation

Update docs when a documented flow changes:

- `docs/stage-3-handoff.md` for Sprint 3 live quiz state.
- `docs/live-quiz-test-plan.md` for manual QA changes.
- `docs/testing-strategy.md` when automated test coverage changes.
- `docs/repository-structure.md` when adding meaningful folders or ownership boundaries.

## Secrets

Never commit real secrets.

- Use `.env.example` for variable names and safe placeholders.
- Use `.env.local` for local values.
- Use GitHub Secrets or Vercel environment variables for hosted environments.
