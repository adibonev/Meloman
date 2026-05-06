# @meloman/web

This package contains the Meloman web application:

- public, auth, admin, host, and player routes
- Next.js Server Actions and API route handlers
- live quiz lobby UI and real-time Pusher refresh wiring
- admin quiz builder forms for all six question types
- Bulgarian and English `next-intl` message files
- Jest tests for live quiz logic, schemas, i18n, and small UI pieces

The root [README.md](../../README.md), [CLAUDE.md](../../CLAUDE.md), and [docs/](../../docs) directory are the source of truth for project-wide setup, architecture, and Stage 3 handoff notes.

## Main Folders

```text
apps/web/
|-- app/                 # App Router routes, layouts, Server Actions, API handlers
|-- components/          # Web-only UI components
|-- i18n/                # next-intl routing and request config
|-- lib/                 # Web helpers, schemas, Pusher, Spotify, R2, live quiz logic
|-- messages/            # bg/en translation files plus key consistency tests
|-- public/              # Static web assets
`-- middleware.ts        # Re-export for Next.js middleware/proxy compatibility
```

## Local Commands

Run commands from the repo root:

```bash
pnpm --filter @meloman/web dev
pnpm --filter @meloman/web lint
pnpm --filter @meloman/web exec tsc --noEmit
pnpm --filter @meloman/web test
pnpm --filter @meloman/web test:coverage
pnpm --filter @meloman/web test:e2e
pnpm --filter @meloman/web build
```

Jest watch mode is available through the root workspace:

```bash
pnpm test:watch
```

## Development Notes

- Use TypeScript and Server Components by default.
- Keep user-facing text in `messages/bg.json` and `messages/en.json`.
- Keep live quiz timing server-authoritative through database timestamps.
- Use Pusher-safe channel names from `lib/pusher-channels.ts`.
- Do not commit `.env.local` or any real secret values.
