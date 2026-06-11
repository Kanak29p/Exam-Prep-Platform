import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../chatbot/ChatWidget", () => ({
  ChatWidget: () => <div data-testid="chat-widget">chat-widget</div>,
}));

import { ChatSupport } from "../ChatSupport";

describe("ChatSupport", () => {
  it("renders the underlying chat widget", () => {
    render(<ChatSupport />);
    expect(screen.getByTestId("chat-widget")).toBeInTheDocument();
  });
});
