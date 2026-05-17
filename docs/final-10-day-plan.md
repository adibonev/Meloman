# Final 10-Day Plan (Defense-Oriented)

Created: 2026-05-16. Deadline: ~2026-05-26. Strategy: **rubric-maximum** (SoftUni §14, target 100/100).

> **Status (2026-05-17): Phases 1–6 SHIPPED**, plus Phase 7 restored
> items (manual point adjustment, Framer polish) and Scalability
> (server-side paging + 10k seed). Unchecked boxes below are historical
> planning, not open work. Remaining = owner tasks only: Loom
> walkthrough, real Vidin dry-run, Expo web live URL after first deploy.

## Status snapshot (2026-05-16)

- Stage 1/2/3 core (auth, quiz builder, live quiz engine) shipped and stable.
- Missing for the grade: REST API surface, Stories, Daily, mobile app, docs, admin completeness.
- Seed content from friend: available. No Android device (mobile tested via emulator; EAS cloud APK).

## Phases

### Phase 1 — REST API + Docs skeleton (Days 1–2) — 7 + 6 pts — no blocker
- [ ] Add REST route handlers wrapping existing logic to reach 30+ endpoints.
- [ ] Quizzes/rounds/questions read+write REST.
- [ ] Sessions REST (state, join, start, next, answer, override) mirroring server actions.
- [ ] Stories/daily/users REST (after Phase 2 tables, stub earlier).
- [ ] README + API docs markdown start; DB Mermaid diagram.

### Phase 2 — Stories + Daily (web + DB) (Days 3–4) — needs seed content
- [ ] Migrations: stories, daily_content, user_progress, badges, user_badges.
- [ ] Stories list + detail (magazine layout), artist spotlight.
- [ ] Daily screen, profile screen, public landing.

### Phase 3 — Admin completeness (Day 5) — 10 pts
- [ ] User management (ban/promote/reset password via Resend).
- [ ] TipTap stories editor (draft/publish).
- [ ] Daily content manager (calendar).
- [ ] Basic analytics dashboard.

### Phase 4 — Mobile app (Days 6–8) — 9 pts — needs free Expo account
- [ ] Expo Router + NativeWind + shared API client.
- [ ] Screens: login, register, home, join quiz (QR), live game, profile/story reader.
- [ ] EAS Android APK (cloud build, no device needed).

### Phase 5 — Seed + Deploy (Day 9) — 10 pts
- [ ] Real seed script (friend content): stories, daily, demo quiz.
- [ ] Vercel production deploy + demo credentials + APK link.

### Phase 6 — Buffer / Loom / fixes (Day 10)
- [ ] Final docs, screenshots, Loom walkthrough, bug fixes.

## Cut (not rubric-blocking) — STATUS 2026-05-17

Originally cut, **now all shipped** except Weekly Clash:
- ✅ Manual points between rounds · ✅ Mystery Artist 4-stage (+cron)
- ✅ Framer Motion polish · ✅ Bilingual quizzes · ✅ Captain transfer
- 🅿️ **Weekly Clash** — stays cut, post-defense (owner decision)
- 👤 Real venue dry-run — owner-side, not code

## Phase 7 — Restore cut items — DONE

All Phase 7 items below shipped (commits in `docs/backlog.md`); kept
for the audit trail. Only Weekly Clash remains out of scope
(not rubric-relevant, large surface, post-defense).

1. ✅ **Manual point adjustment between rounds** (`docs/backlog.md`).
2. ✅ **Mystery Artist 4-stage daily reveal + cron** (`20054f3`).
3. ✅ **Framer Motion polish**.
4. ✅ **Bilingual quizzes (per-question EN overlay)** (`9413f76`).
5. ✅ **Captain transfer in team lobby** (`7c13a81`).
6. 👤 **Real venue dry-run** — owner scheduling, not code.
