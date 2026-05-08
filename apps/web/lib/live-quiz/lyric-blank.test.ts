import { splitLyricByBlanks } from "./lyric-blank";

describe("splitLyricByBlanks", () => {
  it("splits text around ___ placeholders and indexes blanks", () => {
    expect(splitLyricByBlanks("Mama, just ___ a man, put a ___ against his ___")).toEqual([
      { type: "text", value: "Mama, just " },
      { type: "blank", index: 0, revealedWord: null },
      { type: "text", value: " a man, put a " },
      { type: "blank", index: 1, revealedWord: null },
      { type: "text", value: " against his " },
      { type: "blank", index: 2, revealedWord: null },
    ]);
  });

  it("attaches the correct word to each blank when reveal data is supplied", () => {
    const result = splitLyricByBlanks("I ___ you ___", ["love", "more"]);
    expect(result).toEqual([
      { type: "text", value: "I " },
      { type: "blank", index: 0, revealedWord: "love" },
      { type: "text", value: " you " },
      { type: "blank", index: 1, revealedWord: "more" },
    ]);
  });

  it("handles a leading blank without emitting an empty text segment", () => {
    expect(splitLyricByBlanks("___ goodbye")).toEqual([
      { type: "blank", index: 0, revealedWord: null },
      { type: "text", value: " goodbye" },
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(splitLyricByBlanks("")).toEqual([]);
  });
});
