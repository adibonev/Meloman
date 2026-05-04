import {
  gradeAnswer,
  isCloseTextAnswer,
  normalizeAnswer,
  type QuestionForGrading,
} from "./grading";

function question(
  overrides: Partial<QuestionForGrading>
): QuestionForGrading {
  return {
    id: "question-1",
    questionType: "multiple_choice",
    correctAnswer: 0,
    acceptableAnswers: null,
    pointsBase: 1,
    ...overrides,
  };
}

describe("live quiz grading", () => {
  it("normalizes punctuation, casing, whitespace, and diacritics", () => {
    expect(normalizeAnswer("  FrédDie,  MERCURY!!! ")).toBe("freddie mercury");
  });

  it("accepts close text answers within a small typo distance", () => {
    expect(isCloseTextAnswer("Fredie Mercury", ["Freddie Mercury"])).toBe(true);
    expect(isCloseTextAnswer("David Bowie", ["Freddie Mercury"])).toBe(false);
  });

  it("grades multiple choice answers exactly", () => {
    expect(
      gradeAnswer(
        question({ correctAnswer: 2, pointsBase: 3 }),
        { questionType: "multiple_choice", optionIndex: 2 }
      )
    ).toMatchObject({
      submittedAnswer: 2,
      isCorrect: true,
      pointsAwarded: 3,
    });
  });

  it("grades text-like question types using acceptable answers", () => {
    expect(
      gradeAnswer(
        question({
          questionType: "open_text",
          correctAnswer: "Freddie Mercury",
          acceptableAnswers: ["Freddie Mercury", "Mercury"],
          pointsBase: 2,
        }),
        { questionType: "open_text", textAnswer: "mercury" }
      )
    ).toMatchObject({
      submittedAnswer: "mercury",
      isCorrect: true,
      pointsAwarded: 2,
    });
  });

  it("awards lyric blanks per correct blank", () => {
    expect(
      gradeAnswer(
        question({
          questionType: "lyric_blank",
          correctAnswer: ["killed", "gun", "head"],
          pointsBase: 1,
        }),
        {
          questionType: "lyric_blank",
          lyricAnswers: ["killed", "wrong", "head"],
        }
      )
    ).toMatchObject({
      submittedAnswer: ["killed", "wrong", "head"],
      isCorrect: false,
      pointsAwarded: 2,
    });
  });

  it("awards decade partial credit and exact year bonus", () => {
    expect(
      gradeAnswer(
        question({
          questionType: "decade",
          correctAnswer: 1975,
          pointsBase: 2,
        }),
        { questionType: "decade", decade: 1970, year: 1974 }
      )
    ).toMatchObject({
      isCorrect: false,
      pointsAwarded: 2,
    });

    expect(
      gradeAnswer(
        question({
          questionType: "decade",
          correctAnswer: 1975,
          pointsBase: 2,
        }),
        { questionType: "decade", decade: 1960, year: 1975 }
      )
    ).toMatchObject({
      isCorrect: true,
      pointsAwarded: 6,
    });
  });

  it("rejects mismatched submitted question types", () => {
    expect(
      gradeAnswer(
        question({ questionType: "audio", correctAnswer: "Queen" }),
        { questionType: "open_text", textAnswer: "Queen" }
      )
    ).toBeNull();
  });
});
