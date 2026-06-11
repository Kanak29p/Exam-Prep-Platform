import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageBubble } from "../MessageBubble";

describe("MessageBubble", () => {
  it("renders user messages simply", () => {
    render(
      <MessageBubble
        message={{
          id: 1,
          text: "Hello",
          sender: "user",
          time: "10:00 AM",
        }}
      />
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("10:00 AM")).toBeInTheDocument();
  });

  it("renders bot typing indicator state", () => {
    const { container } = render(
      <MessageBubble
        message={{
          id: 2,
          text: "",
          sender: "bot",
          time: "10:01 AM",
          isTyping: true,
        }}
      />
    );
    expect(container.querySelector(".animate-bounce")).toBeInTheDocument();
  });

  it("parses headings and inline bold markdown", () => {
    render(
      <MessageBubble
        message={{
          id: 3,
          text: "# Title 1\n## Title 2 with **bold** text",
          sender: "bot",
          time: "10:02 AM",
        }}
      />
    );
    expect(screen.getByText("Title 1")).toBeInTheDocument();
    expect(screen.getByText(/Title 2 with/)).toBeInTheDocument();
    expect(screen.getByText("bold")).toBeInTheDocument();
  });

  it("parses bullet lists and numbered lists", () => {
    render(
      <MessageBubble
        message={{
          id: 4,
          text: "* Bullet item 1\n- Bullet item 2\n1. Numbered item 1\n2. Numbered item 2",
          sender: "bot",
          time: "10:03 AM",
        }}
      />
    );
    expect(screen.getByText("Bullet item 1")).toBeInTheDocument();
    expect(screen.getByText("Bullet item 2")).toBeInTheDocument();
    expect(screen.getByText("Numbered item 1")).toBeInTheDocument();
    expect(screen.getByText("Numbered item 2")).toBeInTheDocument();
  });

  it("parses tables with and without divider rows", () => {
    const { rerender } = render(
      <MessageBubble
        message={{
          id: 5,
          text: "| Col A | Col B |\n| --- | --- |\n| Val A | Val B |",
          sender: "bot",
          time: "10:04 AM",
        }}
      />
    );
    expect(screen.getByText("Col A")).toBeInTheDocument();
    expect(screen.getByText("Val B")).toBeInTheDocument();

    // Rerender table without divider row
    rerender(
      <MessageBubble
        message={{
          id: 6,
          text: "| Col X | Col Y |\n| Val X | Val Y |",
          sender: "bot",
          time: "10:05 AM",
        }}
      />
    );
    expect(screen.getByText("Col X")).toBeInTheDocument();
    expect(screen.getByText("Val Y")).toBeInTheDocument();
  });

  it("ignores blank lines", () => {
    const { container } = render(
      <MessageBubble
        message={{
          id: 7,
          text: "Line 1\n\nLine 2",
          sender: "bot",
          time: "10:06 AM",
        }}
      />
    );
    expect(screen.getByText("Line 1")).toBeInTheDocument();
    expect(screen.getByText("Line 2")).toBeInTheDocument();
    // Check that there's no empty elements generated for the blank line
    const pElements = container.querySelectorAll("p");
    expect(pElements.length).toBe(2);
  });
});
