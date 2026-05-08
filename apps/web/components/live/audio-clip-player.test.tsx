import { createElement } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { AudioClipPlayer } from "./audio-clip-player";

// Audio playback must be bounded by the answer timer, not the clip length:
// shorter timer cuts playback early; longer timer leaves silence after the
// clip ends naturally. CLAUDE.md §4.6 + memory rule
// project_audio_playback_cap. The tests here lock in the timer-bounded
// pause and the active=false stop.

describe("AudioClipPlayer", () => {
  let playSpy: jest.SpyInstance;
  let pauseSpy: jest.SpyInstance;
  let loadSpy: jest.SpyInstance;

  beforeEach(() => {
    loadSpy = jest
      .spyOn(window.HTMLMediaElement.prototype, "load")
      .mockImplementation(() => undefined);
    playSpy = jest
      .spyOn(window.HTMLMediaElement.prototype, "play")
      .mockImplementation(() => Promise.resolve());
    pauseSpy = jest
      .spyOn(window.HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("starts playback when the question becomes active", () => {
    jest.useFakeTimers();
    jest.spyOn(Date, "now").mockReturnValue(1_000);

    render(
      createElement(AudioClipPlayer, {
        active: true,
        endsAtMs: 11_000,
        questionId: "q1",
        serverNowMs: 1_000,
        signedUrl: "https://example.com/clip.mp3",
      })
    );

    expect(playSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
  });

  it("pauses playback when the timer expires", () => {
    jest.useFakeTimers();
    jest.spyOn(Date, "now").mockReturnValue(1_000);

    render(
      createElement(AudioClipPlayer, {
        active: true,
        endsAtMs: 4_000,
        questionId: "q1",
        serverNowMs: 1_000,
        signedUrl: "https://example.com/clip.mp3",
      })
    );

    expect(pauseSpy).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(3_000);
    });

    expect(pauseSpy).toHaveBeenCalled();
  });

  it("does not start playback when inactive", () => {
    render(
      createElement(AudioClipPlayer, {
        active: false,
        endsAtMs: 11_000,
        questionId: "q1",
        serverNowMs: 1_000,
        signedUrl: "https://example.com/clip.mp3",
      })
    );

    expect(playSpy).not.toHaveBeenCalled();
  });
});
