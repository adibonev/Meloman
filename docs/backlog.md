# Backlog

Last updated: 2026-05-08

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

### Admin sets max team size per quiz

- **What**: Admin UI control to cap how many players can join a single
  team. Enforced server-side at team-join time.
- **Why**: live quiz nights expect 5-6 players per team (per CLAUDE.md §1.1)
  but enforcement is not currently in code.
- **Sprint**: Stage 3 polish (small migration + admin form field).
- **Effort**: small.
- **Notes**: needs a column on `quizzes` (or `game_sessions`); existing
  `joinTeamAction` already counts members for cosmetics, so the count
  query is cheap to extend.

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

### Captain election before the quiz

- **What**: Team members can collectively choose / change captain before
  the quiz starts. Once locked in, only the captain submits answers and
  other phones go to view-only mode.
- **Why**: today the team creator is automatically the captain forever.
  In real life the loudest team member often makes the team, but a
  different member is the music expert.
- **Sprint**: 4 (mobile flows). The team-formation UX is the biggest
  candidate for mobile-friendly polish.
- **Effort**: medium.
- **Notes**: must remain compatible with the captain-only-submit invariant
  (CLAUDE.md §4.3). Consider whether captain can be changed mid-quiz
  (current rule: no) and whether captaincy is "elected" (vote) or "passed"
  (one-tap transfer by current captain).

### Admin sets per-round advancement criteria

- **What**: Admin can configure a rule for which teams advance past a
  given round. E.g. "all teams with > 10 points after round 2 continue".
  Configured before the quiz starts.
- **Why**: the current spec only supports a fixed top-N cutoff for the
  final round (CLAUDE.md §3.1). Adi wants more flexible per-round rules
  for venue-specific formats.
- **Sprint**: Stage 3 medium priority — extends the existing "final round"
  schema. Could be partially implemented with the existing
  `final_round_top_n` for now.
- **Effort**: medium.
- **Notes**: needs schema change on `rounds` (or `quizzes`); needs UI for
  defining the rule type (top-N vs threshold vs manual). Eliminated
  teams already enter spectator mode per CLAUDE.md §3.1.

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
