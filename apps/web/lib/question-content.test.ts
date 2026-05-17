import { resolveQuestionContent, getOverlay } from "./question-content";

const base = {
  questionText: "Кой изпя това?",
  options: ["Куин", "Бийтълс", "АББА", "Поп"],
  acceptableAnswers: ["Куин", "Queen"],
};

describe("resolveQuestionContent", () => {
  test("non-en locale always uses the base", () => {
    expect(
      resolveQuestionContent(base, { en: { questionText: "Who?" } }, "bg")
    ).toEqual(base);
  });

  test("no translations → base", () => {
    expect(resolveQuestionContent(base, null, "en")).toEqual(base);
    expect(resolveQuestionContent(base, undefined, "en")).toEqual(base);
    expect(resolveQuestionContent(base, {}, "en")).toEqual(base);
  });

  test("en overlay replaces only the fields it provides", () => {
    const r = resolveQuestionContent(
      base,
      { en: { questionText: "Who sang this?" } },
      "en"
    );
    expect(r.questionText).toBe("Who sang this?");
    expect(r.options).toEqual(base.options); // untouched
    expect(r.acceptableAnswers).toEqual(base.acceptableAnswers);
  });

  test("options overlay applies only when the count matches the base", () => {
    const full = resolveQuestionContent(
      base,
      { en: { options: ["Queen", "Beatles", "ABBA", "Pop"] } },
      "en"
    );
    expect(full.options).toEqual(["Queen", "Beatles", "ABBA", "Pop"]);

    // Wrong count → keep base (a partial set would mis-map the index).
    const partial = resolveQuestionContent(
      base,
      { en: { options: ["Queen", "Beatles"] } },
      "en"
    );
    expect(partial.options).toEqual(base.options);
  });

  test("blank / malformed overlay fields fall back to base", () => {
    const r = resolveQuestionContent(
      base,
      {
        en: {
          questionText: "   ",
          options: ["Queen", "", "ABBA", "Pop"],
          acceptableAnswers: [],
        },
      },
      "en"
    );
    expect(r).toEqual(base);
  });

  test("acceptableAnswers overlay replaces when valid", () => {
    const r = resolveQuestionContent(
      base,
      { en: { acceptableAnswers: ["Queen", "Queen band"] } },
      "en"
    );
    expect(r.acceptableAnswers).toEqual(["Queen", "Queen band"]);
  });
});

describe("getOverlay", () => {
  test("only the en key is honoured", () => {
    expect(getOverlay({ en: { questionText: "x" } }, "en")).toEqual({
      questionText: "x",
    });
    expect(getOverlay({ en: { questionText: "x" } }, "bg")).toBeNull();
    expect(getOverlay({ de: { questionText: "x" } }, "en")).toBeNull();
    expect(getOverlay(null, "en")).toBeNull();
  });
});
