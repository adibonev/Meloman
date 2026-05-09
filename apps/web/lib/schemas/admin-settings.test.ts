import { createRoundSchema } from "./round";
import { createSponsorSchema } from "./sponsor";
import { updateQuizSchema } from "./quiz";

const BASE_QUIZ = {
  title: "Friday Music Quiz",
  description: "",
  theme: "modern",
  language: "bg",
  status: "draft",
};

const BASE_ROUND = {
  title: "Round 1",
  roundType: "standard",
  introSlideText: "",
};

describe("admin settings schemas", () => {
  it("validates max team size as 0 for unlimited or 1-32 for a cap", () => {
    expect(
      updateQuizSchema.safeParse({ ...BASE_QUIZ, maxTeamSize: "0" }).success
    ).toBe(true);
    expect(
      updateQuizSchema.safeParse({ ...BASE_QUIZ, maxTeamSize: "6" }).success
    ).toBe(true);

    expect(
      updateQuizSchema.safeParse({ ...BASE_QUIZ, maxTeamSize: "-1" }).success
    ).toBe(false);
    expect(
      updateQuizSchema.safeParse({ ...BASE_QUIZ, maxTeamSize: "33" }).success
    ).toBe(false);
  });

  it("accepts empty, single, or multiple sponsor selections", () => {
    expect(
      updateQuizSchema.safeParse({
        ...BASE_QUIZ,
        maxTeamSize: "0",
        sponsorIds: [],
      }).success
    ).toBe(true);
    expect(
      updateQuizSchema.safeParse({
        ...BASE_QUIZ,
        maxTeamSize: "0",
        sponsorIds: ["95e6f2a9-0c4e-41a3-bafe-123456789abc"],
      }).success
    ).toBe(true);
    expect(
      updateQuizSchema.safeParse({
        ...BASE_QUIZ,
        maxTeamSize: "0",
        sponsorIds: [
          "95e6f2a9-0c4e-41a3-bafe-123456789abc",
          "209a50b0-8b68-42b7-b7c8-123456789abc",
        ],
      }).success
    ).toBe(true);

    expect(
      updateQuizSchema.safeParse({
        ...BASE_QUIZ,
        maxTeamSize: "0",
        sponsorIds: ["not-a-uuid"],
      }).success
    ).toBe(false);
  });

  it("validates per-round advancement cutoffs as 0 for no cutoff or 1-32", () => {
    expect(
      createRoundSchema.safeParse({ ...BASE_ROUND, advancementTopN: "0" })
        .success
    ).toBe(true);
    expect(
      createRoundSchema.safeParse({ ...BASE_ROUND, advancementTopN: "4" })
        .success
    ).toBe(true);

    expect(
      createRoundSchema.safeParse({ ...BASE_ROUND, advancementTopN: "-1" })
        .success
    ).toBe(false);
    expect(
      createRoundSchema.safeParse({ ...BASE_ROUND, advancementTopN: "33" })
        .success
    ).toBe(false);
  });

  it("validates sponsor creation payloads", () => {
    expect(
      createSponsorSchema.safeParse({
        name: "Local Bar",
        logoUrl: "https://example.com/logo.png",
      }).success
    ).toBe(true);
    expect(
      createSponsorSchema.safeParse({
        name: "Local Bar",
        logoUrl: "",
      }).success
    ).toBe(true);

    expect(
      createSponsorSchema.safeParse({
        name: "L",
        logoUrl: "https://example.com/logo.png",
      }).success
    ).toBe(false);
    expect(
      createSponsorSchema.safeParse({
        name: "Local Bar",
        logoUrl: "not-a-url",
      }).success
    ).toBe(false);
  });
});
