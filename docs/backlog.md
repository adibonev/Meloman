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
- **Sprint**: SHIPPED in Stage 3 polish.
- **Effort**: large (delivered).
- **Notes**: Project split — `pnpm test:e2e` runs only the DB-safe
  `smoke` set (`public-auth.spec.ts` + `live-quiz-entry.spec.ts`, 8
  tests) so CI stays fast/green; `pnpm test:e2e:full` runs the authed
  suite locally against the dev DB. Mutating specs use timestamped
  names so runs are isolated/re-runnable; session state is gitignored.
  Still post-MVP: a multi-actor live game sim (two contexts, host +
  player, Pusher timing) — needs a dedicated seeded test DB to not be
  flaky. `docs/live-quiz-test-plan.md` remains the manual map.

### Themed admin panel matching quiz theme

- **What**: Admin chrome (sidebar / header / form styling) inherits the
  active quiz's theme (modern monochrome / vintage 70s / neon 80s).
  Today admin is locked to the dark monochrome shell, but the host
  presents from there, so the visual jump from admin → /present is
  jarring on a real venue setup.
- **Why**: the admin panel is part of the live presentation flow, not
  just a backstage tool. It should feel like the quiz it's about to
  run.
- **Sprint**: post-MVP polish. Don't gate the SoftUni defense on this.
- **Effort**: medium. Needs theme tokens decoupled from
  components, theme switching at the admin route level, and probably a
  brand asset pack per theme.
- **Notes**: Tailwind v4 + shadcn already supports a tokens approach;
  the work is mostly defining the three tokens sets and gating the
  admin layout on the active quiz's `theme` field. CLAUDE.md §3.1
  describes the three themes.

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

### Captain election before the quiz (post-MVP, REMINDER)

- **What**: Team members can collectively choose / change captain before
  the quiz starts. Once locked in, only the captain submits answers and
  other phones go to view-only mode.
- **Why**: today the team creator is automatically the captain forever.
  In real life the loudest team member often makes the team, but a
  different member is the music expert.
- **Sprint**: post-release. NOT in MVP per Adi's call (2026-05-08).
- **Effort**: medium.
- **Notes**: REMINDER — pull this back up after MVP launch. Must
  preserve the captain-only-submit invariant (CLAUDE.md §4.3). Decide
  at implementation time whether captaincy is locked at quiz start or
  stays mutable mid-quiz, and whether it's a vote vs. a one-tap
  transfer by the current captain. Memory file:
  `project_captain_election.md`.

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

### Bilingual quiz authoring (post-release, REMINDER)

- **What**: Admin types every question text, options, and answer
  variants in BOTH BG and EN. Player UI shows the version matching the
  active locale; switching locale switches questions too. Replaces the
  current "language is just metadata" model.
- **Why**: an English-marked quiz currently still shows BG question text
  if the admin typed BG (the language flag is metadata only). Adi wants
  one quiz to actually serve both audiences.
- **Sprint**: post-release. NOT in MVP.
- **Effort**: large. Needs:
  - schema change: `questions.questionText` → `questionTextBg` +
    `questionTextEn`; same shape for `acceptableAnswers`, `options`,
    and any text fragment of `correctAnswer`. Migration must backfill
    EN columns from existing BG values (or leave null so admin fills).
  - admin form: parallel BG/EN inputs on every question type; validation
    requires both filled before publish.
  - read path: server picks BG or EN based on locale (or quiz's primary
    language as fallback if EN is missing).
  - grading: fuzzy matching needs to consider both language sets so a
    BG player typing "Куин" against an EN-authored quiz still works.
- **Notes**: REMINDER — pull this back up after MVP launch. We tried a
  smaller "language hint link" in Stage 3 (2026-05-08) but reverted it
  because it implied translation we don't do. The hint only made sense
  alongside actual translated content.

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
- **In-app expo-camera QR scanner (mobile)** — CLAUDE.md §3.1/§2.2 want an
  expo-camera scan inside the Meloman app. The host now shows a scannable
  join QR on the web TV view (`host/[code]` + presentation lobby), so any
  phone's native camera opens `/play/[code]` — the scan-to-join need is
  covered. The in-app scanner stays manual code entry: adding expo-camera
  touches `app.json` native permissions and needs a fresh EAS build to
  validate, which risks the graded Android APK before the capstone
  deadline. Owner decision 2026-05-16: defer to post-deadline (Phase 7).

## Closed

Move items here as they ship to keep the live list short.

- (none yet)
