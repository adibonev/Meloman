import { mysteryStageForHour, sofiaHour } from "./daily-stage";

describe("mysteryStageForHour", () => {
  test("stage 0 before 14:00 — photo only, full XP", () => {
    for (const h of [0, 9, 10, 13]) {
      const s = mysteryStageForHour(h, 3);
      expect(s.stage).toBe(0);
      expect(s.revealedHints).toBe(0);
      expect(s.answerRevealed).toBe(false);
      expect(s.xp).toBe(100);
    }
  });

  test("stage 1 from 14:00 — one hint, 60 XP", () => {
    const s = mysteryStageForHour(14, 3);
    expect(s.stage).toBe(1);
    expect(s.revealedHints).toBe(1);
    expect(s.answerRevealed).toBe(false);
    expect(s.xp).toBe(60);
    expect(mysteryStageForHour(17, 3).stage).toBe(1);
  });

  test("stage 2 from 18:00 — two hints, 30 XP", () => {
    const s = mysteryStageForHour(18, 3);
    expect(s.stage).toBe(2);
    expect(s.revealedHints).toBe(2);
    expect(s.answerRevealed).toBe(false);
    expect(s.xp).toBe(30);
    expect(mysteryStageForHour(21, 3).stage).toBe(2);
  });

  test("stage 3 from 22:00 — answer revealed, no XP", () => {
    for (const h of [22, 23]) {
      const s = mysteryStageForHour(h, 3);
      expect(s.stage).toBe(3);
      expect(s.revealedHints).toBe(3);
      expect(s.answerRevealed).toBe(true);
      expect(s.xp).toBe(0);
    }
  });

  test("revealedHints never exceeds the payload's hint count", () => {
    expect(mysteryStageForHour(18, 1).revealedHints).toBe(1); // wanted 2
    expect(mysteryStageForHour(22, 0).revealedHints).toBe(0);
    expect(mysteryStageForHour(14, 0).revealedHints).toBe(0);
  });

  test("invalid input is handled defensively", () => {
    const s = mysteryStageForHour(NaN, NaN);
    expect(s.stage).toBe(0);
    expect(s.revealedHints).toBe(0);
  });
});

describe("sofiaHour", () => {
  test("returns an integer hour in 0..23", () => {
    const h = sofiaHour(new Date("2026-05-17T12:00:00Z"));
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(24);
  });

  test("applies the Europe/Sofia offset (UTC+2/+3)", () => {
    // 2026-07-01 → EEST (UTC+3): 09:00Z = 12:00 Sofia.
    expect(sofiaHour(new Date("2026-07-01T09:00:00Z"))).toBe(12);
    // 2026-01-01 → EET (UTC+2): 09:00Z = 11:00 Sofia.
    expect(sofiaHour(new Date("2026-01-01T09:00:00Z"))).toBe(11);
  });
});
