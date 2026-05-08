import {
  createTeamSchema,
  joinAsAnonymousSchema,
  joinTeamSchema,
  submitAnswerSchema,
} from "./play";

const DEVICE_FINGERPRINT = "device-fingerprint-123";
const TEAM_ID = "95e6f2a9-0c4e-41a3-bafe-123456789abc";

describe("play schemas", () => {
  it("validates anonymous player names", () => {
    expect(
      joinAsAnonymousSchema.safeParse({ displayName: "Adi" }).success
    ).toBe(true);
    expect(joinAsAnonymousSchema.safeParse({ displayName: "A" }).success).toBe(
      false
    );
  });

  it("validates create-team payloads with device fingerprints", () => {
    expect(
      createTeamSchema.safeParse({
        name: "Queen Fans",
        deviceFingerprint: DEVICE_FINGERPRINT,
      }).success
    ).toBe(true);

    expect(
      createTeamSchema.safeParse({
        name: "Q",
        deviceFingerprint: "short",
      }).success
    ).toBe(false);
  });

  it("validates join-team payloads with UUID team ids", () => {
    expect(
      joinTeamSchema.safeParse({
        teamId: TEAM_ID,
        deviceFingerprint: DEVICE_FINGERPRINT,
      }).success
    ).toBe(true);

    expect(
      joinTeamSchema.safeParse({
        teamId: "not-a-uuid",
        deviceFingerprint: DEVICE_FINGERPRINT,
      }).success
    ).toBe(false);
  });

  it("coerces multiple-choice option indexes from form strings", () => {
    const result = submitAnswerSchema.safeParse({
      questionType: "multiple_choice",
      optionIndex: "2",
    });

    expect(result.success).toBe(true);
    if (result.success && result.data.questionType === "multiple_choice") {
      expect(result.data.optionIndex).toBe(2);
    }
  });

  it("rejects out-of-range multiple-choice options", () => {
    expect(
      submitAnswerSchema.safeParse({
        questionType: "multiple_choice",
        optionIndex: "4",
      }).success
    ).toBe(false);
  });

  it("trims and validates text-like answers", () => {
    const result = submitAnswerSchema.safeParse({
      questionType: "open_text",
      textAnswer: "  Freddie Mercury  ",
    });

    expect(result.success).toBe(true);
    if (result.success && result.data.questionType === "open_text") {
      expect(result.data.textAnswer).toBe("Freddie Mercury");
    }

    expect(
      submitAnswerSchema.safeParse({
        questionType: "audio",
        textAnswer: "   ",
      }).success
    ).toBe(false);
  });

  it("validates lyric blank and decade answers", () => {
    expect(
      submitAnswerSchema.safeParse({
        questionType: "lyric_blank",
        lyricAnswers: ["love", "you"],
      }).success
    ).toBe(true);

    expect(
      submitAnswerSchema.safeParse({
        questionType: "decade",
        decade: "1970",
        year: "1975",
      }).success
    ).toBe(true);

    expect(
      submitAnswerSchema.safeParse({
        questionType: "decade",
        decade: "1890",
        year: "1975",
      }).success
    ).toBe(false);
  });

  it("rejects decade answers when the year falls outside the picked decade", () => {
    // Player picked the 70s but typed 1985 — server-side defense in case the
    // client UI is bypassed (the visible form already disables submit here).
    expect(
      submitAnswerSchema.safeParse({
        questionType: "decade",
        decade: "1970",
        year: "1985",
      }).success
    ).toBe(false);

    // Boundary checks: first and last year of the decade are both valid.
    expect(
      submitAnswerSchema.safeParse({
        questionType: "decade",
        decade: "1970",
        year: "1970",
      }).success
    ).toBe(true);
    expect(
      submitAnswerSchema.safeParse({
        questionType: "decade",
        decade: "1970",
        year: "1979",
      }).success
    ).toBe(true);
  });
});
