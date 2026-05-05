# Claude Stage 3 Prompt

Use this prompt when handing the project back to Claude Code.

```text
Read these files first:

- CLAUDE.md
- AGENTS.md
- CONTRIBUTING.md
- docs/repository-structure.md
- docs/stage-3-handoff.md
- docs/live-quiz-test-plan.md
- docs/testing-strategy.md
- docs/pre-friday-backlog.md

Continue Sprint/Stage 3 for Meloman.

Current goal:
Build the remaining live quiz engine pieces without breaking the existing playable host/player lobby flow.

Important constraints:
- Bulgarian for chat, English for code/comments/commit messages.
- Keep repository structure professional and documented.
- Keep commits small and focused.
- Use Pusher-safe channel names only: quiz-{CODE}, quiz-{CODE}-host, presence-team-{TEAM_ID}.
- DB writes are the source of truth; failed Pusher broadcasts must not create runtime overlays.
- Captain-only submit must remain enforced server-side.
- Timer authority is questionEndsAt from the DB, not the local browser clock.
- Audio clip length and answer timer are separate: shorter timer cuts playback early; longer timer leaves silence after the clip ends.
- User-facing strings must use next-intl.
- Do not use forbidden libraries from CLAUDE.md.
- Run lint, typecheck, tests, and build before handing back substantial work.

Suggested next implementation:
Start with the fullscreen host presentation route and reuse the existing session state, question loading, timer, and Pusher refresh wiring.
```
```
