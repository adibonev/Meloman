# Pre-Friday Backlog

Last updated: 2026-05-05

This is a short working list for the days before Friday, 2026-05-08. It separates safe repo-hardening work from Stage 3 product work that should stay with Claude Code.

## Safe For Codex

These are low-risk improvements that should not conflict with the main Stage 3 implementation:

- Keep docs aligned with current code behavior.
- Keep `.env.example` complete and safe.
- Keep README and repository structure docs accurate.
- Add Jest tests for pure logic, schemas, i18n key consistency, and small isolated components.
- Clean lint warnings and dead imports.
- Improve CI/PR/contribution workflow.
- Add manual QA checklists for flows that are still too broad for automated tests.
- Review copy for stale feature-pending messages when the feature already exists.

## Claude-Owned Stage 3 Work

These are product/architecture tasks that should be implemented in a focused Claude Code session:

- Fullscreen host presentation route.
- Keyboard controls for the host presentation.
- Audio playback from R2 signed URLs inside the live quiz flow, respecting the separate clip-duration vs answer-timer behavior.
- Image reveal blur sync.
- Live answer count updates.
- Leaderboard broadcast and display.
- Host override panel for disputed open-text answers.
- Pause/resume timer state.
- End-of-quiz podium.
- Final round logic.

## Current Quality Gate

Run this before ending substantial work:

```bash
pnpm --filter @meloman/web lint
pnpm --filter @meloman/web exec tsc --noEmit
pnpm --filter @meloman/web test
pnpm --filter @meloman/web build
```

## Suggested Order

1. Keep Codex on safe hardening and review work.
2. Let Claude Code handle fullscreen host presentation first.
3. Re-run the manual live quiz checklist after each Stage 3 feature.
4. Only add Playwright after the host/player flow stabilizes.
