import {
  createDecadeQuestionSchema,
  createImageRevealQuestionMetadataSchema,
  createLyricBlankQuestionSchema,
  createMultipleChoiceQuestionSchema,
  createOpenTextQuestionSchema,
  countLyricBlanks,
  decadeFromYear,
} from "./question";

const BASE_QUESTION = {
  questionText: "Who sings this song?",
  timeLimitSeconds: 20,
  pointsBase: 1,
};

describe("question schemas", () => {
  it("coerces and validates multiple-choice question payloads", () => {
    const result = createMultipleChoiceQuestionSchema.safeParse({
      ...BASE_QUESTION,
      options: ["Queen", "ABBA", "Nirvana", "Madonna"],
      correctIndex: "2",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.correctIndex).toBe(2);
    }

    expect(
      createMultipleChoiceQuestionSchema.safeParse({
        ...BASE_QUESTION,
        options: ["Only", "Three", "Options"],
        correctIndex: 0,
      }).success
    ).toBe(false);
  });

  it("requires at least one acceptable open-text answer", () => {
    expect(
      createOpenTextQuestionSchema.safeParse({
        ...BASE_QUESTION,
        acceptableAnswers: ["Freddie Mercury"],
      }).success
    ).toBe(true);

    expect(
      createOpenTextQuestionSchema.safeParse({
        ...BASE_QUESTION,
        acceptableAnswers: [],
      }).success
    ).toBe(false);
  });

  it("requires attribution for image sources that need it", () => {
    expect(
      createImageRevealQuestionMetadataSchema.safeParse({
        ...BASE_QUESTION,
        acceptableAnswers: ["David Bowie"],
        imageSource: "Wikipedia",
        imageAttribution: "Wikipedia contributors",
        blurPx: 24,
      }).success
    ).toBe(true);

    expect(
      createImageRevealQuestionMetadataSchema.safeParse({
        ...BASE_QUESTION,
        acceptableAnswers: ["David Bowie"],
        imageSource: "Wikipedia",
        imageAttribution: "",
        blurPx: 24,
      }).success
    ).toBe(false);

    expect(
      createImageRevealQuestionMetadataSchema.safeParse({
        ...BASE_QUESTION,
        acceptableAnswers: ["David Bowie"],
        imageSource: "AlbumCover",
        imageAttribution: "",
        blurPx: 24,
      }).success
    ).toBe(true);
  });

  it("rejects blurPx outside the supported range", () => {
    expect(
      createImageRevealQuestionMetadataSchema.safeParse({
        ...BASE_QUESTION,
        acceptableAnswers: ["David Bowie"],
        imageSource: "AlbumCover",
        imageAttribution: "",
        blurPx: 1,
      }).success
    ).toBe(false);

    expect(
      createImageRevealQuestionMetadataSchema.safeParse({
        ...BASE_QUESTION,
        acceptableAnswers: ["David Bowie"],
        imageSource: "AlbumCover",
        imageAttribution: "",
        blurPx: 200,
      }).success
    ).toBe(false);
  });

  it("matches lyric blanks to the answer count", () => {
    expect(countLyricBlanks("I ___ you ___")).toBe(2);

    expect(
      createLyricBlankQuestionSchema.safeParse({
        lyricText: "I ___ you ___ forever",
        answers: ["love", "more"],
        timeLimitSeconds: 30,
        pointsBase: 1,
      }).success
    ).toBe(true);

    expect(
      createLyricBlankQuestionSchema.safeParse({
        lyricText: "I ___ you ___ forever",
        answers: ["love"],
        timeLimitSeconds: 30,
        pointsBase: 1,
      }).success
    ).toBe(false);
  });

  it("validates decade year bounds and derives decades", () => {
    expect(decadeFromYear(1975)).toBe(1970);

    expect(
      createDecadeQuestionSchema.safeParse({
        ...BASE_QUESTION,
        correctYear: "1975",
      }).success
    ).toBe(true);

    expect(
      createDecadeQuestionSchema.safeParse({
        ...BASE_QUESTION,
        correctYear: 1899,
      }).success
    ).toBe(false);
  });
});
