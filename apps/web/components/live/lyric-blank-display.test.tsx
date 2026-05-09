import { createElement } from "react";
import { render } from "@testing-library/react";
import { LyricBlankDisplay } from "./lyric-blank-display";

const baseProps = {
  answerOrderLabel: "Answer order",
  blankCountLabel: "2 blanks",
  correctWords: ["moon", "June"],
  perBlankPointsLabel: "1 point each",
  text: "Fly me to the ___, let me play among the stars in ___",
};

describe("LyricBlankDisplay", () => {
  it("shows metadata and keeps answers hidden while active", () => {
    const { getByText, queryByText } = render(
      createElement(LyricBlankDisplay, {
        ...baseProps,
        reveal: false,
      })
    );

    expect(getByText("2 blanks")).toBeInTheDocument();
    expect(getByText("1 point each")).toBeInTheDocument();
    expect(queryByText("1. moon")).not.toBeInTheDocument();
  });

  it("shows ordered answer chips on reveal", () => {
    const { getByText } = render(
      createElement(LyricBlankDisplay, {
        ...baseProps,
        reveal: true,
      })
    );

    expect(getByText("Answer order")).toBeInTheDocument();
    expect(getByText("1. moon")).toBeInTheDocument();
    expect(getByText("2. June")).toBeInTheDocument();
  });
});
