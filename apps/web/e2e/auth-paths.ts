// Storage-state paths shared by the Playwright config, the auth setup,
// and authed specs. Kept dependency-free (no @playwright/test import) so
// importing it from a spec can't trigger a config-load cycle.
export const ADMIN_STATE = "playwright/.auth/admin.json";
export const PLAYER_STATE = "playwright/.auth/player.json";
