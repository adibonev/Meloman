# Repository Structure

Last updated: 2026-05-04

This document explains how the Meloman repository is organized and how future work should keep it professional, readable, and easy to review.

## Top-Level Folders

```text
meloman/
|-- apps/
|-- packages/
|-- docs/
|-- .github/
|-- AGENTS.md
|-- CLAUDE.md
|-- README.md
|-- package.json
|-- pnpm-workspace.yaml
`-- turbo.json
```

## `apps/`

Application entry points live here.

Current apps:

- `apps/web` - Next.js web application, server actions, API routes, admin UI, live quiz UI, and i18n messages.

Future apps:

- `apps/mobile` - Expo mobile app planned for Sprint 4.

Rules:

- Keep app-specific code inside its app folder.
- Do not put shared business logic directly in an app if another app will need it later.
- Use route-local components when they are used by only one route.
- Promote reusable app components to `apps/web/components`.

## `apps/web`

Important folders:

- `app/` - Next.js App Router routes, layouts, pages, API routes, and server actions.
- `components/` - reusable React components.
- `components/ui/` - shadcn/ui primitives.
- `components/admin/` - admin-specific shared components.
- `components/live/` - live quiz reusable components.
- `lib/` - web-specific utilities, service clients, schemas, and pure logic.
- `messages/` - next-intl translation files.
- `i18n/` - next-intl routing and request setup.
- `types/` - app-level TypeScript declarations.

Rules:

- Server Components are the default.
- Add `"use client"` only for state, effects, browser APIs, or event handlers.
- Keep user-facing strings in `messages/bg.json` and `messages/en.json`.
- Keep pure logic in `lib/` and cover it with Jest when practical.
- Keep route actions close to the route that owns them.

## `packages/`

Shared packages live here.

Current packages:

- `packages/db` - Drizzle schema, migrations, Neon client, and seed script.
- `packages/shared` - reserved for shared schemas, types, and utilities.
- `packages/ui` - reserved for shared UI components when web/mobile sharing is needed.

Rules:

- Database tables live in `packages/db/schema`, one file per domain.
- Migrations must be committed with schema changes.
- Shared code should be framework-light and useful to more than one app.
- Do not move code into a package just to make the tree look abstract.

## `docs/`

Project documentation lives here.

Current docs:

- `stage-3-handoff.md` - current live quiz state and next work for Claude or another AI agent.
- `live-quiz-test-plan.md` - manual QA checklist for Stage 3.
- `repository-structure.md` - this document.

Rules:

- Add docs when they help future work, reviews, or SoftUni evaluation.
- Keep docs short enough to stay useful.
- Update docs when a documented flow changes.

## `.github/`

GitHub automation lives here.

Current workflow:

- `.github/workflows/ci.yml` - runs web lint, typecheck, tests, and build.

Rules:

- CI should protect the default branch from broken builds.
- Keep workflow env values non-secret unless they come from GitHub Secrets.
- Do not commit production secrets.

## Root Files

- `README.md` - public project overview and setup instructions.
- `CLAUDE.md` - master AI/project context.
- `AGENTS.md` - AI transparency deliverable.
- `package.json` - root scripts.
- `turbo.json` - task pipeline.
- `pnpm-workspace.yaml` - workspace package map.

## Maintenance Rules

- Keep the folder tree honest: do not document folders that do not exist unless clearly marked as planned.
- Prefer small focused commits with Conventional Commit messages.
- Avoid unrelated cleanup inside feature commits.
- Keep generated artifacts out of git unless the project explicitly needs them.
- Run lint, typecheck, tests, and build before handing back substantial work.
- If a new folder is introduced, make its purpose obvious through naming or documentation.
- If a file becomes too broad, split by responsibility instead of adding more unrelated code to it.
