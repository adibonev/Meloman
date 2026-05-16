# Final 10-Day Plan (Defense-Oriented)

Created: 2026-05-16. Deadline: ~2026-05-26. Strategy: **rubric-maximum** (SoftUni §14, target 100/100).

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

## Cut (not rubric-blocking)
Framer Motion polish, Weekly Clash, real venue dry-run, manual points between rounds,
bilingual quizzes, Mystery Artist 4-stage cron (minimal daily version only).

## Phase 7 — Restore cut items (only if Phases 1–6 finish early)

Priority order = product value × low risk. Each is independent; do top-down,
test each before the next (methodical pacing).

1. **Manual point adjustment between rounds** — highest real-quiz-night value
   (host fixes disputed scores before the cutoff). Builds on existing override
   panel + applyRoundCutoff. ~0.5 day.
2. **Mystery Artist 4-stage daily cron** — Vercel Cron flips reveal stage at
   10/14/18/22h; upgrades the minimal daily version. ~0.5 day.
3. **Framer Motion polish** — reveal / podium / between-rounds slide
   animations. Pure presentation, zero logic risk. ~0.5 day.
4. **Bilingual quizzes (BG+EN per question)** — deferred per memory; schema +
   admin form + player render. ~1 day. Larger surface, do last.
5. **Captain election / transfer in team lobby** — deferred per memory.
   ~0.5 day.
6. **Real venue dry-run** — needs scheduling with the friend; not code, but
   the most valuable validation if a date fits before the deadline.

Weekly Clash stays out of scope (not rubric-relevant, large surface).
