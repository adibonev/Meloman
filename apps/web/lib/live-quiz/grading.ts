import type { SubmitAnswerInput } from "@/lib/schemas/play";

export type SubmittedAnswer =
  | number
  | string
  | string[]
  | { decade: number; year: number };

export type GradeResult = {
  submittedAnswer: SubmittedAnswer;
  isCorrect: boolean;
  pointsAwarded: number;
};

export type QuestionForGrading = {
  id: string;
  questionType:
    | "multiple_choice"
    | "open_text"
    | "audio"
    | "image_reveal"
    | "lyric_blank"
    | "decade";
  correctAnswer: unknown;
  acceptableAnswers: unknown;
  pointsBase: number;
};

export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }
    for (let j = 0; j <= b.length; j++) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

export function isCloseTextAnswer(
  submitted: string,
  accepted: string[]
): boolean {
  const normalizedSubmitted = normalizeAnswer(submitted);
  if (!normalizedSubmitted) return false;

  return accepted.some((candidate) => {
    const normalizedCandidate = normalizeAnswer(candidate);
    return (
      normalizedCandidate.length > 0 &&
      (normalizedSubmitted === normalizedCandidate ||
        levenshteinDistance(normalizedSubmitted, normalizedCandidate) <= 2)
    );
  });
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function getAcceptedTextAnswers(question: QuestionForGrading): string[] {
  const accepted = new Set<string>();
  if (typeof question.correctAnswer === "string") {
    accepted.add(question.correctAnswer);
  }
  for (const answer of getStringArray(question.acceptableAnswers)) {
    accepted.add(answer);
  }
  return [...accepted];
}

function decadeFromYear(year: number): number {
  return Math.floor(year / 10) * 10;
}

export function gradeAnswer(
  question: QuestionForGrading,
  submitted: SubmitAnswerInput
): GradeResult | null {
  if (question.questionType !== submitted.questionType) {
    return null;
  }

  if (submitted.questionType === "multiple_choice") {
    if (typeof question.correctAnswer !== "number") return null;
    const isCorrect = question.correctAnswer === submitted.optionIndex;
    return {
      submittedAnswer: submitted.optionIndex,
      isCorrect,
      pointsAwarded: isCorrect ? question.pointsBase : 0,
    };
  }

  if (
    submitted.questionType === "open_text" ||
    submitted.questionType === "audio" ||
    submitted.questionType === "image_reveal"
  ) {
    const isCorrect = isCloseTextAnswer(
      submitted.textAnswer,
      getAcceptedTextAnswers(question)
    );
    return {
      submittedAnswer: submitted.textAnswer,
      isCorrect,
      pointsAwarded: isCorrect ? question.pointsBase : 0,
    };
  }

  if (submitted.questionType === "lyric_blank") {
    const correctAnswers = getStringArray(question.correctAnswer);
    if (correctAnswers.length === 0) return null;

    const correctCount = submitted.lyricAnswers.reduce(
      (count, answer, index) => {
        const expected = correctAnswers[index];
        if (!expected) return count;
        return isCloseTextAnswer(answer, [expected]) ? count + 1 : count;
      },
      0
    );

    return {
      submittedAnswer: submitted.lyricAnswers,
      isCorrect:
        correctCount === correctAnswers.length &&
        submitted.lyricAnswers.length === correctAnswers.length,
      pointsAwarded: correctCount * question.pointsBase,
    };
  }

  if (submitted.questionType === "decade") {
    if (typeof question.correctAnswer !== "number") return null;
    const correctDecade = decadeFromYear(question.correctAnswer);
    const yearCorrect = submitted.year === question.correctAnswer;
    const decadeCorrect = yearCorrect || submitted.decade === correctDecade;
    return {
      submittedAnswer: {
        decade: submitted.decade,
        year: submitted.year,
      },
      isCorrect: yearCorrect,
      pointsAwarded:
        (decadeCorrect ? question.pointsBase : 0) +
        (yearCorrect ? question.pointsBase * 2 : 0),
    };
  }

  return null;
}
