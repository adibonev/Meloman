// Per-question bilingual overlay resolver. Base columns
// (question_text / options / acceptable_answers) are canonical
// (authored in the quiz's primary language). `questions.translations`
// may carry an `en` overlay; we apply it field-by-field for the active
// locale and fall back to the base whenever an overlay field is missing
// or malformed — a partial translation never blanks a question.

export type QuestionOverlay = {
  questionText?: string;
  options?: string[];
  acceptableAnswers?: string[];
};

export type QuestionTranslations = {
  en?: QuestionOverlay;
} | null;

export type ResolvedQuestionContent = {
  questionText: string;
  options: string[];
  acceptableAnswers: string[];
};

function cleanStr(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v : null;
}

function cleanStrArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  const arr = v.filter(
    (x): x is string => typeof x === "string" && x.trim().length > 0
  );
  return arr.length > 0 && arr.length === v.length ? arr : null;
}

/** Narrow unknown JSONB into the overlay shape for a given locale. */
export function getOverlay(
  translations: unknown,
  locale: string
): QuestionOverlay | null {
  if (locale !== "en") return null; // only an EN overlay is supported
  if (!translations || typeof translations !== "object") return null;
  const en = (translations as Record<string, unknown>).en;
  if (!en || typeof en !== "object") return null;
  return en as QuestionOverlay;
}

export function resolveQuestionContent(
  base: ResolvedQuestionContent,
  translations: unknown,
  locale: string
): ResolvedQuestionContent {
  const overlay = getOverlay(translations, locale);
  if (!overlay) return base;

  return {
    questionText: cleanStr(overlay.questionText) ?? base.questionText,
    // Options must match the base count (4 for MC) or we keep the base —
    // a half-translated option set would mis-map the correct index.
    options:
      cleanStrArray(overlay.options)?.length === base.options.length
        ? (cleanStrArray(overlay.options) as string[])
        : base.options,
    acceptableAnswers:
      cleanStrArray(overlay.acceptableAnswers) ?? base.acceptableAnswers,
  };
}
