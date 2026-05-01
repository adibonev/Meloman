# Meloman

A music quiz platform with two surfaces: a **live quiz system** for in-person trivia nights, and a **daily engagement app** with Song of the Day, Mystery Artist, streaks, and editorial stories.

Built as the SoftUni "Full Stack Apps with AI" capstone project and as a real product launch for the Bulgarian music page [Meloman](https://www.facebook.com/meloman) (~1,000 followers).

> Status: **Sprint 1 in progress** — foundation (auth, monorepo, i18n, deploy). See [`CLAUDE.md`](CLAUDE.md) §10 for the full sprint plan.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Components) |
| Language | TypeScript (strict) |
| Database | Neon PostgreSQL (EU Frankfurt) + Drizzle ORM |
| Auth | Auth.js v5 + JWT, three roles (`player` / `admin` / `super_admin`) |
| Real-time | Pusher Channels (cluster: `eu`) — *Sprint 3* |
| Object storage | Cloudflare R2 — *Sprint 2* |
| Mobile | Expo SDK 52 + React Native + NativeWind — *Sprint 4* |
| Styling | Tailwind v4 + shadcn/ui |
| Validation | Zod (shared schemas across web + mobile) |
| i18n | next-intl (BG default, EN at `/en/...`) |
| Email | Resend |
| Monorepo | Turborepo + pnpm workspaces |
| Hosting | Vercel |

Locked by the SoftUni curriculum. See [`CLAUDE.md`](CLAUDE.md) §2 for the full list and the *forbidden alternatives* list.

---

## Monorepo layout

```
meloman/
├── apps/
│   ├── web/                  # Next.js 15 — UI + REST API
│   └── mobile/               # Expo React Native — added in Sprint 4
├── packages/
│   ├── db/                   # Drizzle schema, migrations, Neon client
│   ├── shared/               # Cross-app Zod schemas, types, utilities
│   └── ui/                   # Optional shared React components
├── CLAUDE.md                 # Master AI context (read this first)
├── AGENTS.md                 # AI agent usage policy (SoftUni requirement)
└── turbo.json                # Turborepo pipeline config
```

---

## Local setup

### Prerequisites

- Node.js **≥ 20**
- pnpm **≥ 9** (this repo pins `pnpm@10.33.2` via `packageManager`)
- A Neon Postgres database (free tier is fine)
- Auth.js secret (`openssl rand -base64 32`)

### First-time install

```bash
pnpm install
cp .env.example apps/web/.env.local
# Fill in DATABASE_URL and AUTH_SECRET at minimum.
# Pusher / R2 / Resend keys can be left blank until those features are wired up.
```

### Database

```bash
pnpm --filter @meloman/db db:generate   # generate SQL from schema changes
pnpm --filter @meloman/db db:migrate    # apply migrations to Neon
pnpm --filter @meloman/db db:studio     # open Drizzle Studio
```

### Run the web app

```bash
pnpm dev
```

Opens at [http://localhost:3000](http://localhost:3000). Bulgarian is default; English is at `/en`.

### Other scripts

```bash
pnpm build   # production build (turbo)
pnpm lint    # lint all packages
```

---

## Environment variables

See [`.env.example`](.env.example) for the full list. Required for local dev:

- `DATABASE_URL` — Neon Postgres connection string
- `AUTH_SECRET` — Auth.js JWT signing secret

Optional until those features land:

- `PUSHER_*` and `NEXT_PUBLIC_PUSHER_*` — Sprint 3
- `R2_*` — Sprint 2
- `RESEND_API_KEY` — Sprint 1 (forgot-password) and beyond

Never commit `.env.local`. It is gitignored.

---

## Roles

Three roles are defined in the database (see [`packages/db/schema/users.ts`](packages/db/schema/users.ts)):

- `player` — default for new sign-ups. Can play quizzes and read stories.
- `admin` — manages quizzes, stories, daily content.
- `super_admin` — full access, including user management. Adi and his project co-owner are super admins.

Role-based protection lives in [`apps/web/middleware.ts`](apps/web/middleware.ts).

---

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — master context (product spec, architecture, conventions, sprint plan)
- [`AGENTS.md`](AGENTS.md) — how AI agents are used in this project (SoftUni deliverable)
- API docs and architecture diagrams will land in `docs/` during Sprint 6.

---

## License

See [`LICENSE`](LICENSE).
