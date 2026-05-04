# Meloman

[![CI](https://github.com/adibonev/meloman/actions/workflows/ci.yml/badge.svg)](https://github.com/adibonev/meloman/actions/workflows/ci.yml)

Meloman is a music quiz platform with two product surfaces:

- **Live quiz system** for in-person trivia nights: host screen, player phones, teams, real-time events, scoring, and leaderboard flow.
- **Daily engagement app** for music fans: Song of the Day, Mystery Artist, streaks, badges, and editorial stories.

The project is both Adi Bonev's SoftUni "Full Stack Apps with AI" capstone and a real product for the Bulgarian music page Meloman.

> Status: **Sprint 3 in progress**. The quiz builder and live quiz foundation are implemented; fullscreen host presentation, leaderboard, override flow, and final polish are still in progress.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Web app | Next.js App Router, React, TypeScript |
| Database | Neon PostgreSQL + Drizzle ORM |
| Auth | Auth.js v5 + JWT roles |
| Real-time | Pusher Channels |
| Storage | Cloudflare R2 |
| Styling | Tailwind CSS + shadcn/ui |
| Validation | Zod |
| i18n | next-intl, Bulgarian default |
| Testing | Jest |
| Monorepo | Turborepo + pnpm workspaces |
| Hosting | Vercel |

Technology choices are constrained by the SoftUni curriculum. See [CLAUDE.md](CLAUDE.md) for the full architecture notes and forbidden alternatives.

---

## Repository Layout

```text
meloman/
|-- apps/
|   `-- web/                  # Next.js web app, API routes, server actions
|-- packages/
|   |-- db/                   # Drizzle schema, migrations, Neon client, seed script
|   |-- shared/               # Reserved for cross-app schemas and utilities
|   `-- ui/                   # Reserved for shared UI primitives
|-- docs/                     # Handoff notes, test plans, architecture notes
|-- .github/workflows/        # CI automation
|-- AGENTS.md                 # AI agent transparency document
|-- CLAUDE.md                 # Master project context for AI-assisted work
|-- package.json              # Root workspace scripts
|-- pnpm-workspace.yaml       # pnpm workspace definition
`-- turbo.json                # Turborepo task pipeline
```

For a deeper explanation of folder ownership and maintenance rules, see [docs/repository-structure.md](docs/repository-structure.md).

---

## Local Setup

### Prerequisites

- Node.js 20 or newer
- pnpm 10.33.2 or compatible
- Neon PostgreSQL database
- Auth.js secret

### Install

```bash
pnpm install
```

Create local environment files:

```bash
cp .env.example .env.local
cp .env.example apps/web/.env.local
```

Fill in at least:

- `DATABASE_URL`
- `AUTH_SECRET`

Pusher, R2, Resend, Spotify, and Wikipedia-related variables are needed only for the features that use them.

Never commit `.env.local`; it is gitignored.

### Database

```bash
pnpm --filter @meloman/db db:generate
pnpm --filter @meloman/db db:migrate
pnpm --filter @meloman/db db:studio
```

### Web App

```bash
pnpm --filter @meloman/web dev
```

The web app runs at [http://localhost:3000](http://localhost:3000). Bulgarian routes use `/bg/...`; English routes use `/en/...`.

---

## Quality Gates

Run these before committing feature work:

```bash
pnpm --filter @meloman/web lint
pnpm --filter @meloman/web exec tsc --noEmit
pnpm --filter @meloman/web test
pnpm --filter @meloman/web build
```

Jest watch mode:

```bash
pnpm test:watch
```

GitHub Actions runs lint, typecheck, tests, and build on pushes to `main` and pull requests.

---

## Current Live Quiz Docs

- [docs/stage-3-handoff.md](docs/stage-3-handoff.md) - current Stage 3 status and remaining work.
- [docs/live-quiz-test-plan.md](docs/live-quiz-test-plan.md) - manual QA checklist for host/player flows.

---

## Roles

- `player` - default user role; can play quizzes and read content.
- `admin` - can manage quizzes, stories, and daily content.
- `super_admin` - full access, including user management.

Role-based route protection lives in [apps/web/proxy.ts](apps/web/proxy.ts).

---

## AI Usage

AI assistance is documented for transparency:

- [AGENTS.md](AGENTS.md) describes which AI tools are used and what they are allowed to do.
- [CLAUDE.md](CLAUDE.md) is the master project context and must be read before AI-assisted coding.

Humans review all architecture decisions and commits.

---

## License

See [LICENSE](LICENSE).
