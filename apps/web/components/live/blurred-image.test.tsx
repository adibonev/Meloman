import { createElement } from "react";
import { render } from "@testing-library/react";
import { BlurredImage } from "./blurred-image";

// Memory rule (project_image_reveal_static_blur): the image stays heavily
// blurred during the active question and only un-blurs on reveal. We test
// the inline filter directly to lock in that behavior — accidental
// "progressive unblur" would change the read of correctAnswer's filter.

describe("BlurredImage", () => {
  it("applies the admin-configured blur while the answer is hidden", () => {
    const { getByRole } = render(
      createElement(BlurredImage, {
        alt: "test",
        attribution: null,
        blurPx: 32,
        reveal: false,
        signedUrl: "https://example.com/image.jpg",
      })
    );

    const img = getByRole("img") as HTMLImageElement;
    expect(img.style.filter).toBe("blur(32px)");
  });

  it("falls back to the default blur when no value is set", () => {
    const { getByRole } = render(
      createElement(BlurredImage, {
        alt: "test",
        attribution: null,
        blurPx: null,
        reveal: false,
        signedUrl: "https://example.com/image.jpg",
      })
    );

    const img = getByRole("img") as HTMLImageElement;
    expect(img.style.filter).toBe("blur(24px)");
  });

  it("removes the blur on reveal and shows the attribution", () => {
    const { getByRole, getByText } = render(
      createElement(BlurredImage, {
        alt: "test",
        attribution: "Photo: Wikipedia / CC BY-SA",
        blurPx: 24,
        reveal: true,
        signedUrl: "https://example.com/image.jpg",
      })
    );

    const img = getByRole("img") as HTMLImageElement;
    expect(img.style.filter).toBe("blur(0px)");
    expect(getByText("Photo: Wikipedia / CC BY-SA")).toBeInTheDocument();
  });

  it("does not show the attribution while the image is still blurred", () => {
    const { queryByText } = render(
      createElement(BlurredImage, {
        alt: "test",
        attribution: "Photo: Wikipedia / CC BY-SA",
        blurPx: 24,
        reveal: false,
        signedUrl: "https://example.com/image.jpg",
      })
    );

    expect(queryByText("Photo: Wikipedia / CC BY-SA")).not.toBeInTheDocument();
  });
});
