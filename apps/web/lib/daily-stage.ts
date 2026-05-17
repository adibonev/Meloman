// Daily Mystery Artist reveal stages (CLAUDE.md §3.2). The day unlocks
// progressively: more hints + lower XP as time passes, answer at 22:00.
// Computed from the wall clock (Europe/Sofia) at request time — the
// /daily page is a dynamic server component so this is always fresh; a
// Vercel Cron only busts any cached HTML at the stage boundaries.
//
// Pure + deterministic (hour is injected) so it unit-tests without
// faking time. Spec boundaries: 10:00 photo (100 XP) · 14:00 +hint 1
// (60) · 18:00 +hint 2 (30) · 22:00 answer (0).

export type MysteryStage = {
  /** 0 = photo only, 1 = +hint1, 2 = +hint2, 3 = answer revealed. */
  stage: 0 | 1 | 2 | 3;
  /** How many hints to show now (clamped to what the payload has). */
  revealedHints: number;
  answerRevealed: boolean;
  /** XP a correct guess earns at the current stage. */
  xp: number;
};

const STAGE_TABLE: { fromHour: number; stage: 0 | 1 | 2 | 3; xp: number }[] = [
  { fromHour: 22, stage: 3, xp: 0 },
  { fromHour: 18, stage: 2, xp: 30 },
  { fromHour: 14, stage: 1, xp: 60 },
  { fromHour: 0, stage: 0, xp: 100 },
];

/** Stage for a given Europe/Sofia wall-clock hour (0–23). */
export function mysteryStageForHour(
  hour: number,
  totalHints: number
): MysteryStage {
  const safeHour = Number.isFinite(hour) ? Math.floor(hour) : 0;
  const safeTotal = Math.max(0, Math.floor(totalHints) || 0);
  const row =
    STAGE_TABLE.find((r) => safeHour >= r.fromHour) ??
    STAGE_TABLE[STAGE_TABLE.length - 1];

  return {
    stage: row.stage,
    answerRevealed: row.stage === 3,
    // Stage 1 → 1 hint, stage 2 → 2 hints, stage 3 → all hints.
    revealedHints:
      row.stage === 3 ? safeTotal : Math.min(row.stage, safeTotal),
    xp: row.xp,
  };
}

/** Current Europe/Sofia hour, DST-aware (no extra deps — Intl tz data). */
export function sofiaHour(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Sofia",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "0";
  // "24" can appear at midnight in some environments — normalise to 0.
  const n = Number.parseInt(hour, 10) % 24;
  return Number.isFinite(n) ? n : 0;
}

export function mysteryStageNow(
  now: Date,
  totalHints: number
): MysteryStage {
  return mysteryStageForHour(sofiaHour(now), totalHints);
}
