import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { ImageWithFallback } from "./ImageWithFallback";

describe("ImageWithFallback", () => {
  it("renders the provided src and alt initially", () => {
    render(
      <ImageWithFallback
        src="https://example.com/image.png"
        alt="A nice image"
        className="rounded"
      />,
    );
    const img = screen.getByAltText("A nice image") as HTMLImageElement;
    expect(img.src).toBe("https://example.com/image.png");
    expect(img.className).toContain("rounded");
  });

  it("swaps to fallback image when the original errors", () => {
    render(
      <ImageWithFallback
        src="broken.png"
        alt="My image"
        className="merge-class"
        style={{ width: "10px" }}
      />,
    );
    const img = screen.getByAltText("My image");
    fireEvent.error(img);

    const fallback = screen.getByAltText(
      "Error loading image",
    ) as HTMLImageElement;
    expect(fallback).toBeInTheDocument();
    expect(fallback.getAttribute("data-original-url")).toBe("broken.png");

    const wrapper = fallback.closest("div.inline-block")!;
    expect(wrapper.className).toContain("merge-class");
  });

  it("forwards extra props to the underlying img", () => {
    render(
      <ImageWithFallback
        src="x.png"
        alt="Photo"
        data-testid="my-img"
        loading="lazy"
      />,
    );
    const img = screen.getByTestId("my-img") as HTMLImageElement;
    expect(img.getAttribute("loading")).toBe("lazy");
  });
});
