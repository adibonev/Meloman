import { createElement } from "react";
import { act, render, screen } from "@testing-library/react";
import {
  formatCountdownTime,
  getCountdownRemainingMs,
  TimerCountdown,
} from "./timer-countdown";

describe("timer countdown", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

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

  it("renders the active countdown label and time", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);

    render(
      createElement(TimerCountdown, {
        active: true,
        endedLabel: "Time is up",
        endsAtMs: 61_000,
        label: "Time left",
        serverNowMs: 1_000,
      })
    );

    expect(screen.getByText("Time left")).toBeInTheDocument();
    expect(screen.getByText("01:00")).toBeInTheDocument();
  });

  it("renders nothing when inactive", () => {
    const { container } = render(
      createElement(TimerCountdown, {
        active: false,
        endedLabel: "Time is up",
        endsAtMs: 61_000,
        label: "Time left",
        serverNowMs: 1_000,
      })
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("switches to the ended label when time runs out", () => {
    jest.useFakeTimers();
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);

    render(
      createElement(TimerCountdown, {
        active: true,
        endedLabel: "Time is up",
        endsAtMs: 1_250,
        label: "Time left",
        serverNowMs: 1_000,
      })
    );

    expect(screen.getByText("Time left")).toBeInTheDocument();
    expect(screen.getByText("00:01")).toBeInTheDocument();

    nowSpy.mockReturnValue(1_250);

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(screen.getByText("Time is up")).toBeInTheDocument();
    expect(screen.queryByText("00:01")).not.toBeInTheDocument();
  });
});
