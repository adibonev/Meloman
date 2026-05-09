import { createElement } from "react";
import { render } from "@testing-library/react";
import {
  DecadeYearDisplay,
  formatDecadeShort,
} from "./decade-year-display";

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
    expect(queryByText("70s")).not.toBeInTheDocument();
    expect(queryByText("1975")).not.toBeInTheDocument();
  });

  it("shows the short derived decade and exact year on reveal", () => {
    const { getByText } = render(
      createElement(DecadeYearDisplay, {
        ...baseProps,
        reveal: true,
      })
    );

    expect(getByText("70s")).toBeInTheDocument();
    expect(getByText("1975")).toBeInTheDocument();
  });

  it("formats modern decades as short music-quiz labels", () => {
    expect(formatDecadeShort(1980)).toBe("80s");
    expect(formatDecadeShort(1990)).toBe("90s");
    expect(formatDecadeShort(2000)).toBe("00s");
  });
});
