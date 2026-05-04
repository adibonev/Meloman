import {
  quizChannelName,
  quizHostChannelName,
  teamPresenceChannelName,
} from "./pusher-channels";

const PUSHER_SAFE_CHANNEL_RE = /^[A-Za-z0-9_-]+$/;

describe("Pusher channel names", () => {
  it("builds quiz channels without invalid punctuation", () => {
    expect(quizChannelName("JFDAVF")).toBe("quiz-JFDAVF");
    expect(quizChannelName("JFDAVF")).toMatch(PUSHER_SAFE_CHANNEL_RE);
  });

  it("builds host and presence channels inside Pusher's allowed charset", () => {
    expect(quizHostChannelName("JFDAVF")).toBe("quiz-JFDAVF-host");
    expect(teamPresenceChannelName("95e6f2a9-0c4e-41a3-bafe")).toMatch(
      PUSHER_SAFE_CHANNEL_RE
    );
  });
});
