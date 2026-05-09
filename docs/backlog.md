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

### Manual point adjustment between rounds

- **What**: Host can add or remove points from any team between rounds
  (or even during reveal) for venue-specific bonuses, manual corrections
  beyond the per-answer override panel, or penalising obvious cheating.
- **Why**: Adi runs real quiz nights where things happen the system can't
  predict — a team gets an extra point for a hilarious wrong answer, a
  team is docked for using their phone, etc. The current host override
  panel only lets him toggle individual question answers.
- **Sprint**: Stage 3 polish if simple, otherwise post-MVP.
- **Effort**: small to medium.
- **Notes**: can be implemented as a `+ / -` control next to each team
  on the host lobby (active during `between_rounds` / `reveal` /
  `paused`); writes to `teams.total_score` directly with a Pusher
  scoresUpdated broadcast. Consider a small audit log column or
  separate `score_adjustments` table to keep history (but that's
  bigger).

### Playwright tests covering every interactive button

- **What**: Build out the Playwright suite so every clickable control
  in the host + player + admin flows has at least one happy-path
  automated test. Adi shouldn't have to manually click through every
  feature when verifying a release.
- **Why**: pre-defense the manual QA load is real, and SoftUni grading
  rewards observable test coverage.
- **Sprint**: Stage 3 polish for high-priority flows; broader coverage
  post-MVP.
- **Effort**: medium to large depending on coverage target.
- **Notes**: existing Playwright suite in `apps/web/e2e/` covers
  public/auth navigation only. Logical next targets are: live quiz
  end-to-end (host start → reveal → next), admin quiz creation, sponsor
  CRUD, override panel, between-rounds slide. Use `docs/live-quiz-test-plan.md`
  as the manual-to-automated translation map.

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

## Closed

Move items here as they ship to keep the live list short.

- (none yet)
