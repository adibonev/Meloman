# Meloman REST API

All endpoints are under `/api`. Auth is via the Auth.js v5 session
cookie/JWT; `requireUser` / `requireAdmin` guards (`lib/api/guard.ts`)
enforce role. Errors use the standard envelope:

```json
{ "error": { "code": "string", "message": "string" } }
```

Status codes: `400` invalid JSON, `401` not signed in, `403` not admin,
`404` not found, `422` validation failed, `503` transient (DB / join-code).

> The live-quiz **state transitions** (start / reveal / next / pause /
> resume / answer / override) are driven by Pusher-backed **Server
> Actions**, not REST, per the architecture in CLAUDE.md §5.2. The REST
> session endpoints below are the read/poll-fallback surface (CLAUDE.md
> §5.4) and session creation.

## Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | — | Auth.js handlers (login, session, logout, OAuth callbacks) |
| POST | `/api/auth/register` | — | Create a player; returns a bearer JWT (auto sign-in) or `{ pending: true }` when email verification is enforced |
| POST | `/api/auth/mobile-login` | — | Email/password → bearer JWT for the Expo app |
| GET | `/api/auth/me` | user | Current user `{ id, email, name, role }` |
| GET | `/api/auth/verify-email?token=` | — | Confirm an email; redirects to `/login?verified=1` |
| POST | `/api/auth/forgot-password` | — | Email a password-reset link (silent — never reveals account existence) |
| POST | `/api/auth/reset-password` | — | Consume a reset token and set a new password |

Web clients authenticate via the Auth.js session cookie; the mobile app
sends `Authorization: Bearer <jwt>` (from `/api/auth/mobile-login` or
`/api/auth/register`). The `requireUser` guard accepts either.

Email verification and OAuth (Google / Facebook) are env-gated and ship
disabled by default — see CLAUDE.md and `.env.example`. Password reset
and verification email both degrade gracefully without `RESEND_API_KEY`
(the link is logged instead of sent).

## Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | — | Liveness + DB probe; `503` if DB unreachable |

## Quizzes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/quizzes` | admin | List non-deleted quizzes |
| POST | `/api/quizzes` | admin | Create quiz |
| GET | `/api/quizzes/[id]` | admin | Quiz detail + rounds |
| PATCH | `/api/quizzes/[id]` | admin | Update core fields + status |
| DELETE | `/api/quizzes/[id]` | admin | Soft delete (sets `deleted_at`) |
| GET | `/api/quizzes/[id]/rounds` | admin | List rounds for a quiz |
| POST | `/api/quizzes/[id]/rounds` | admin | Append a round |

## Rounds & Questions

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/rounds/[id]` | admin | Round detail + its questions |
| DELETE | `/api/rounds/[id]` | admin | Delete round (cascades to questions) |
| GET | `/api/rounds/[id]/questions` | admin | List questions for a round |
| GET | `/api/questions/[id]` | admin | Full question detail |
| DELETE | `/api/questions/[id]` | admin | Delete question |

Question **creation/update** stays in admin Server Actions (type-specific
validation + R2 multipart media upload).

## Sessions (live quiz)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/sessions` | admin | Create a session for a quiz → join code |
| GET | `/api/sessions/[code]` | user | Session state + `serverNow` (poll fallback) |
| GET | `/api/sessions/[code]/play` | user | Full player state (team, question, timer) for the mobile poll loop |
| POST | `/api/sessions/[code]/answer` | user | Captain submits the team's answer |
| GET | `/api/sessions/[code]/teams` | user | Leaderboard (teams by `total_score`) |
| POST | `/api/sessions/[code]/teams` | user | Create or join a team |

## Helpers (admin autofill)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/spotify/search?q=` | admin | Spotify track metadata autofill |
| GET | `/api/wikipedia/search?q=` | admin | Wikipedia artist bio/image autofill |

## Stories & Daily

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/stories` | — | List published stories (paginated) |
| POST | `/api/stories` | admin | Create a story draft |
| GET | `/api/stories/[slug]` | — | Story detail (bumps view_count) |
| PATCH | `/api/stories/[slug]` | admin | Update + publish/unpublish |
| GET | `/api/daily/today` | — | Today's Song of the Day / Mystery Artist |
| GET | `/api/daily/archive` | — | Past daily entries (paginated) for the mobile archive |
| GET | `/api/events` | — | Public quiz events, time-classified upcoming / live / past |
| GET | `/api/users/me/progress` | user | Streak, XP and earned badges |

Admin user management (ban / role) and daily content management run as
Server Actions (`/admin/users`, `/admin/daily`), not REST, because they are
admin-UI-only and never consumed by the mobile client.
