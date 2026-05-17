# Backlog

Last updated: 2026-05-09

This is the canonical place for user-driven feedback that is too big or out
of scope for the current Stage 3 slice. Items here are NOT promised — they
are queued, prioritised, and pulled into a sprint when the time fits.

For Stage 3 work-in-progress, see `docs/stage-3-handoff.md`.
For pre-defense triage, see `docs/pre-friday-backlog.md`.

## Format

Each item lists:

- **What**: the change in one line.
- **Why**: the user's reasoning or motivation.
- **Sprint**: which sprint this fits in (per CLAUDE.md §10), or "Stage 3
  polish" if it can be slotted into the current sprint.
- **Effort**: rough sizing — small / medium / large.
- **Notes**: hidden constraints, related invariants, open questions.

## Items

### Manual point adjustment between rounds (LANDED 2026-05-16)

- **What**: SHIPPED. A `−/+` stepper next to each team on the host
  lobby's between-rounds slide. Host builds a delta and commits once;
  writes `teams.total_score` (clamped at 0) and fires one Pusher
  `scores-updated` broadcast so every screen refreshes.
- **Why**: Adi runs real quiz nights where things happen the system
  can't predict — a bonus for a hilarious answer, a dock for phone use
  — beyond what the per-answer override panel covers.
- **Sprint**: SHIPPED in Stage 3 polish.
- **Effort**: small to medium (delivered).
- **Notes**: Scoped to `between_rounds` only (not reveal/paused) —
  that's when the host reviews the leaderboard and mid-question editing
  would race the grader. Bounded to ±100 server-side against
  fat-fingers. No audit table: the correction is a denormalized total
  write, history is out of scope; a `score_adjustments` table stays a
  bigger post-MVP option if disputes ever need a paper trail.

### Guest-host MP4 final round (LANDED 2026-05-16)

- **What**: SHIPPED. Admin attaches an MP4 (≤30 MB, R2) to a `final`
  round on the round edit page; the host presentation shows a "Guest
  video" control that plays it fullscreen on the TV.
- **Why**: CLAUDE.md §3.1 guest-host final variant — the friend's
  quizzes have a celebrity-intro bumper before the final questions.
- **Sprint**: SHIPPED in Stage 3 polish.
- **Effort**: medium (delivered).
- **Notes**: Playback is **host-triggered**, not an automated
  pre-question gate. The timer is server-authoritative and only runs in
  `active` (§4.4); a gate that auto-plays the clip and pauses the
  countdown before every final question would need a state-machine
  addition, deliberately out of scope near the deadline. The host
  already drives all pacing (§3.1), so they play the bumper during
  reveal / before advancing. Upload rides the Server Action like audio;
  large clips remain the documented signed-URL upgrade (lib/r2.ts).

### Playwright tests covering every interactive button (LANDED 2026-05-17)

- **What**: SHIPPED. Authed Playwright coverage so Adi doesn't
  click-test every feature by hand. A `setup` project logs in once
  with the demo accounts and reuses the session; the `full` project
  drives the real button flows: admin quiz authoring end to end
  (create → publish → round → multiple-choice question → start live
  session → host lobby with join code + QR), sponsor create/delete,
  story creation through the TipTap editor, signed-in player profile
  + content nav.
- **Why**: pre-defense the manual QA load is real, and SoftUni grading
  rewards observable test coverage.
- **Sprint**: SHIPPED in Stage 3 polish; **coverage completed
  2026-05-17** (40 tests: 10 smoke + 2 setup + 28 full).
- **Notes**: all green (`smoke` 10, `full` 30 incl. setup). Project
  split — `pnpm test:e2e` runs the DB-safe `smoke` set (public-auth +
  live-quiz-entry + reset-password) so CI stays fast/green; `pnpm
  test:e2e:full` runs the full authed suite locally vs the dev DB.
  **Full coverage map:**
  - Admin authoring: quiz create/publish, all 6 question type forms,
    edit/delete (quiz title, question, round), quiz edit
    (theme/language/team-size + sponsor assignment), round + question
    reorder, round-type edit, sponsor CRUD, TipTap story create.
  - Admin content: daily Song-of-Day + Mystery-Artist create/delete,
    user role change + ban/unban + send-reset (throwaway account),
    story edit + publish/unpublish, analytics dashboard.
  - Auth: register → login → logout round-trip, wrong-password error
    (plus the smoke client-validation set).
  - Live game: full two-actor loop (join → answer → reveal → finish),
    host pause/resume, between-rounds score adjust, existing-team join
    via anonymous path, captain-only submit lock, wrong-answer reveal,
    host manual override accepting a fuzzy-missed open answer.
  - Public: stories index → magazine detail, artist spotlight, daily
    render.
  Mutating specs use timestamped names so runs are isolated/
  re-runnable; session state is gitignored; anonymous specs pass an
  explicit empty storageState (the full project's default admin state
  would otherwise leak in).
- **Deliberately excluded (honest, low marginal value / high flake):**
  real R2 media uploads for audio/image/guest-video questions and
  real email-token extraction — asserted at the validation boundary
  instead (missing-file / generic-confirm guards), no flaky external
  dependency. The 2-team per-round cutoff → eliminated-spectator path
  needs ≥2 parallel player contexts in separate teams plus
  advancement timing across Pusher (high flake); `between_rounds` and
  the inter-round leaderboard are already covered by host-controls.
  The Expo app is out of scope (Playwright is web-only).
  `docs/live-quiz-test-plan.md` remains the manual map.

### Per-quiz theme on the quiz experience (LANDED 2026-05-17)

- **What**: SHIPPED — but **scoped to the quiz surfaces, not the admin
  panel** (owner decision 2026-05-17). `quizzes.theme`
  (modern/vintage/neon) was a dead field; it now re-skins the host
  `/present`, host lobby, the player live screen, and the mobile play
  screen. `modern` = the warm design-tokens default (untouched);
  `vintage`/`neon` are additive scoped `[data-quiz-theme]` CSS-var
  blocks in `globals.css` + a `QuizTheme` wrapper. Mobile mirrors it
  via `quizPalette()`.
- **Why**: the original idea was "theme the admin chrome too" so
  admin→/present isn't jarring; the owner decided the theme belongs to
  the quiz/presentation only, keeping the warm app/admin shell intact
  (consistent with the design-tokens single-source decision).
- **Sprint**: SHIPPED (commit `b642cbd`).
- **Notes**: admin chrome intentionally stays warm — not a gap.
  Full mobile NativeWind re-skin + on-device visual QA is the only
  documented follow-up (verified via tsc + expo export, no emulator).

### Daily song by mood (player-facing)

- **What**: In the daily app, ask the user what mood they're in (pick from a
  list), then suggest a known song that fits or counter-balances it. E.g.
  user picks "sad" → app proposes a known feel-good track.
- **Why**: the daily app is meant to be habit-forming entertainment; mood
  selection makes the daily experience feel personal.
- **Sprint**: 5 (Daily Engagement, CLAUDE.md §3.2).
- **Effort**: medium. Needs:
  - mood enum + UI picker
  - admin tagging of songs by mood (or LLM-driven matching)
  - daily flow that surfaces a mood-matched suggestion
- **Notes**: avoid streaming full songs (CLAUDE.md §4.6); link to Spotify /
  YouTube instead. Consider whether moods can drive **all** daily content
  (Song of the Day, Mystery Artist) or only a side feature.

### Admin sets max team size per quiz (LANDED 2026-05-09)

- **What**: Admin UI control to cap how many players can join a single
  team. Enforced server-side at team-join time.
- **Why**: live quiz nights expect 5-6 players per team (per CLAUDE.md §1.1).
- **Sprint**: SHIPPED in Stage 3.
- **Effort**: small (delivered).
- **Notes**: `quizzes.max_team_size` is configured in the admin quiz detail
  form, the player team picker marks full teams, and `joinTeamAction`
  enforces the cap server-side.

### Players can switch team / better team picker UX

- **What**: After joining one team, allow the player to leave and switch.
  Improve the join landing screen so existing teams are obvious to spot.
- **Why**: Adi reported existing teams not always being visible / joinable
  in his testing. Suspected cause is the device-fingerprint anti-cheat
  blocking the second action when both players test from the same browser.
- **Sprint**: Stage 3 polish, after we reproduce the failure mode.
- **Effort**: small (clarification + maybe small UI tweak) to medium (if we
  add "leave team" flow).
- **Notes**: NEEDS CLARIFICATION from Adi — what exactly fails? Same
  browser? Different browsers? Are there console errors? See conversation
  notes 2026-05-08.

### Captain transfer before the quiz (LANDED 2026-05-17)

- **What**: SHIPPED. The sitting captain can hand the role to any
  teammate from the team lobby (one-tap transfer, not a vote).
- **Sprint**: SHIPPED (commit `7c13a81`).
- **Notes**: Decision taken — captaincy is **locked at quiz start**
  (mutable only while session status is `lobby`); server enforces
  lobby-only + caller-is-captain + target-is-member, preserving the
  captain-only-submit invariant (CLAUDE.md §4.3). `transferCaptain` in
  play-service, `CaptainControls` client component, e2e in
  `live-depth.spec.ts`.

### Admin sets per-round advancement criteria (LANDED 2026-05-08)

- **What**: Admin configures `rounds.advancement_top_n` per round. After
  the round reveals its last question, the session enters
  `between_rounds`; the host clicks "Start next round" (or `SPACE`) and
  the cutoff is applied — bottom teams flip to `teams.is_active = false`
  and are locked out of submits.
- **Why**: SHIPPED as the user-facing answer to "I want to know how many
  teams advance between rounds and have a leaderboard slide before the
  next round starts."
- **Sprint**: SHIPPED in Stage 3.
- **Effort**: large (delivered).
- **Notes**: Top-N only. Score-threshold rules (e.g. "everyone with > 10
  pts continues") are not implemented; threshold-style criteria can be a
  follow-up that adds another column on `rounds` (`advancement_min_score`)
  and a UI toggle. Legacy `quizzes.final_round_top_n` and
  `teams.is_finalist` remain in the DB but are dormant; drop them once
  we've confirmed nothing in production reads them.

### Bilingual quiz authoring (LANDED 2026-05-17)

- **What**: SHIPPED — per-question **EN overlay** (not the originally
  proposed dual columns). Base question columns stay canonical
  (primary language); a nullable `questions.translations` jsonb holds
  an optional `{ en: { questionText?, options?, acceptableAnswers? } }`
  overlay (migration `0012`). Player live screen + host `/present`
  resolve by locale with base fallback; grading unions base ∪ EN
  accepted answers; admin has a collapsible per-question English editor
  on the round detail.
- **Sprint**: SHIPPED (commit `9413f76`).
- **Notes**: chose the overlay over dual columns to avoid a
  destructive migration and keep every existing row working untouched.
  Pure resolver `lib/question-content.ts` is unit-tested; only an `en`
  overlay key is supported (BG base + EN overlay). The earlier reverted
  "language hint link" is now backed by real translated content.

## Deferred during 10-day sprint

- ~~**TipTap stories editor**~~ — DONE 2026-05-16. The admin stories
  body is now a WYSIWYG TipTap editor (StarterKit + toolbar) in
  `components/admin/rich-text-editor.tsx`. Behaviour-compatible: a
  hidden `name="body"` input fed from `editor.getHTML()` keeps the
  FormData contract, so the server action and `stories.body` HTML
  storage are unchanged.
- ~~**Reset password from user admin**~~ — DONE 2026-05-17. Full
  password reset shipped: stateless HS256 token (no DB table), shared
  service behind REST routes (`/api/auth/forgot-password`,
  `/api/auth/reset-password`) + web `(auth)` pages, "Forgot password?"
  on login, and a super-admin "Reset password" button that emails the
  user a link. Resend degrades gracefully (logs the link without
  `RESEND_API_KEY`) so it works in dev / unverified-domain demos.
- ~~**NativeWind in mobile app**~~ — DONE 2026-05-17. All 8 mobile
  screens/components migrated from StyleSheet to NativeWind v4
  className (CLAUDE.md §2.2). Warm palette mirrored into
  `tailwind.config.js` so styling is unchanged (exact px values).
  pnpm-monorepo gotcha fixed: `react-native-css-interop` added as a
  direct mobile dep so Metro resolves nativewind's jsx-runtime.
  Validated structurally — `expo export` (iOS + web) bundles clean on
  Expo SDK 55 / RN 0.83 / React Compiler. Visual confirmation is via
  `expo start --web` or an Android EAS build: Expo Go can't run SDK 55
  (App Store Expo Go only supports the latest stable SDK), which is
  unrelated to NativeWind.
- ~~**In-app expo-camera QR scanner (mobile)**~~ — DONE 2026-05-17
  (commit `1be8536`). The join screen has a "Сканирай QR код" path:
  `expo-camera` `CameraView` reads the host /present QR,
  `parseJoinCode()` extracts the code from the join URL (or a pasted
  raw code), then joins. All three permission states handled. The pure
  parser is unit-tested; the camera itself needs a real device / dev
  build (Expo Go on SDK 55 and `expo export` can't exercise it) —
  on-device QA is the only owner-side follow-up.
- ~~**Mobile automated tests**~~ — DONE 2026-05-17 (commit `dd1b468`).
  Was zero; added a dependency-light ts-jest setup (no jest-expo/RN
  renderer — component/Detox tests need a device, documented
  follow-up) covering the pure logic (`quizPalette` parity guard,
  `parseJoinCode`). CI runs mobile typecheck + these tests.
- ~~**Mystery Artist 4-stage daily reveal**~~ — DONE 2026-05-17
  (commit `20054f3`). Hints + answer unlock by Europe/Sofia wall clock
  (10/14/18/22), server-time computed (pure, DST-aware, unit-tested),
  with a secured Vercel Cron busting cached HTML at the boundaries.

## Closed

Move items here as they ship to keep the live list short.

- (none yet)
