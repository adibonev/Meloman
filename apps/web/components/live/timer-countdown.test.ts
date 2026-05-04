import {
  formatCountdownTime,
  getCountdownRemainingMs,
} from "./timer-countdown";

describe("timer countdown", () => {
  it("formats remaining milliseconds as mm:ss", () => {
    expect(formatCountdownTime(0)).toBe("00:00");
    expect(formatCountdownTime(1_000)).toBe("00:01");
    expect(formatCountdownTime(61_000)).toBe("01:01");
  });

  it("rounds partial seconds up for a fair visible countdown", () => {
    expect(formatCountdownTime(1)).toBe("00:01");
    expect(formatCountdownTime(60_001)).toBe("01:01");
  });

  it("clamps inactive or expired timers to zero", () => {
    expect(getCountdownRemainingMs(null, 1_000, true)).toBe(0);
    expect(getCountdownRemainingMs(2_000, 1_000, false)).toBe(0);
    expect(getCountdownRemainingMs(1_000, 2_000, true)).toBe(0);
  });
});
