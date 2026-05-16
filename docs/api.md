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
| GET/POST | `/api/auth/[...nextauth]` | — | Auth.js handlers (login, session, logout) |
| POST | `/api/auth/mobile-login` | — | Email/password → bearer JWT for the Expo app |
| GET | `/api/auth/me` | user | Current user `{ id, email, name, role }` |

Web clients authenticate via the Auth.js session cookie; the mobile app
sends `Authorization: Bearer <jwt>` (from `/api/auth/mobile-login`). The
`requireUser` guard accepts either.

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
| GET | `/api/sessions/[code]/teams` | user | Leaderboard (teams by `total_score`) |

## Helpers (admin autofill)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/spotify/search?q=` | admin | Spotify track metadata autofill |
| GET | `/api/wikipedia/search?q=` | admin | Wikipedia artist bio/image autofill |

## Planned (Phase 2–3)

Stories (`GET/POST /api/stories`, `GET/PATCH /api/stories/[slug]`), Daily
(`GET /api/daily/today`, `POST /api/daily/song/answer`,
`POST /api/daily/mystery/guess`), Progress (`GET /api/users/me/progress`),
Admin users (`POST /api/admin/users/[id]/ban`,
`POST /api/admin/users/[id]/role`), `POST /api/admin/upload`.
