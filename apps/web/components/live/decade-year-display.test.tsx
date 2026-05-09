import { createElement } from "react";
import { render } from "@testing-library/react";
import { DecadeYearDisplay } from "./decade-year-display";

const baseProps = {
  correctYear: 1975,
  decadeLabel: "Decade",
  decadePointsLabel: "1 point",
  exactYearLabel: "Exact year",
  exactYearPointsLabel: "2 points",
  promptLabel: "Guess the decade and year",
  questionText: "When was this song released?",
};

describe("DecadeYearDisplay", () => {
  it("hides the exact answer while active", () => {
    const { getAllByText, queryByText } = render(
      createElement(DecadeYearDisplay, {
        ...baseProps,
        reveal: false,
      })
    );

    expect(getAllByText("?")).toHaveLength(2);
    expect(queryByText("1970s")).not.toBeInTheDocument();
    expect(queryByText("1975")).not.toBeInTheDocument();
  });

  it("shows the derived decade and exact year on reveal", () => {
    const { getByText } = render(
      createElement(DecadeYearDisplay, {
        ...baseProps,
        reveal: true,
      })
    );

    expect(getByText("1970s")).toBeInTheDocument();
    expect(getByText("1975")).toBeInTheDocument();
  });
});
