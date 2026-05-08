import {
  gradeAnswer,
  isCloseTextAnswer,
  levenshteinDistance,
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
    expect(normalizeAnswer("  Fr\u00e9dDie,  MERCURY!!! ")).toBe(
      "freddie mercury"
    );
    expect(normalizeAnswer("AC/DC - Thunderstruck (Live)")).toBe(
      "ac dc thunderstruck live"
    );
  });

  it("accepts close text answers within a small typo distance", () => {
    expect(isCloseTextAnswer("Fredie Mercury", ["Freddie Mercury"])).toBe(true);
    expect(isCloseTextAnswer("David Bowie", ["Freddie Mercury"])).toBe(false);
    expect(isCloseTextAnswer("   ", ["Freddie Mercury"])).toBe(false);
  });

  it("calculates edit distance for typo-sensitive text grading", () => {
    expect(levenshteinDistance("queen", "queen")).toBe(0);
    expect(levenshteinDistance("fredie", "freddie")).toBe(1);
    expect(levenshteinDistance("bowie", "queen")).toBeGreaterThan(2);
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

    expect(
      gradeAnswer(
        question({ correctAnswer: 2, pointsBase: 3 }),
        { questionType: "multiple_choice", optionIndex: 1 }
      )
    ).toMatchObject({
      submittedAnswer: 1,
      isCorrect: false,
      pointsAwarded: 0,
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

    expect(
      gradeAnswer(
        question({
          questionType: "audio",
          correctAnswer: "Bohemian Rhapsody",
          acceptableAnswers: null,
          pointsBase: 4,
        }),
        { questionType: "audio", textAnswer: "bohemian rhapsody" }
      )
    ).toMatchObject({
      submittedAnswer: "bohemian rhapsody",
      isCorrect: true,
      pointsAwarded: 4,
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

    expect(
      gradeAnswer(
        question({
          questionType: "lyric_blank",
          correctAnswer: ["love", "you"],
          pointsBase: 2,
        }),
        {
          questionType: "lyric_blank",
          lyricAnswers: ["love", "you", "extra"],
        }
      )
    ).toMatchObject({
      submittedAnswer: ["love", "you", "extra"],
      isCorrect: false,
      pointsAwarded: 4,
    });
  });

  it("requires exact (case-insensitive) lyric blanks; no fuzzy match", () => {
    // Regression: the original implementation used Levenshtein <= 2 here,
    // which incorrectly awarded a point for "run" against "gun" (distance
    // 1) during a real test session. CLAUDE.md §3.1 Type 5 says lyric
    // scoring is case-insensitive only.
    expect(
      gradeAnswer(
        question({
          questionType: "lyric_blank",
          correctAnswer: ["killed", "gun", "head"],
          pointsBase: 1,
        }),
        {
          questionType: "lyric_blank",
          lyricAnswers: ["get", "run", "asd"],
        }
      )
    ).toMatchObject({
      submittedAnswer: ["get", "run", "asd"],
      isCorrect: false,
      pointsAwarded: 0,
    });

    // Diacritics + case still normalize, just no Levenshtein.
    expect(
      gradeAnswer(
        question({
          questionType: "lyric_blank",
          correctAnswer: ["Куин"],
          pointsBase: 1,
        }),
        {
          questionType: "lyric_blank",
          lyricAnswers: ["куин"],
        }
      )
    ).toMatchObject({
      isCorrect: true,
      pointsAwarded: 1,
    });
  });

  it("returns null when lyric blanks have no stored correct answers", () => {
    expect(
      gradeAnswer(
        question({
          questionType: "lyric_blank",
          correctAnswer: [],
        }),
        {
          questionType: "lyric_blank",
          lyricAnswers: ["anything"],
        }
      )
    ).toBeNull();
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

    expect(
      gradeAnswer(
        question({
          questionType: "decade",
          correctAnswer: 1975,
          pointsBase: 2,
        }),
        { questionType: "decade", decade: 1980, year: 1981 }
      )
    ).toMatchObject({
      isCorrect: false,
      pointsAwarded: 0,
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
