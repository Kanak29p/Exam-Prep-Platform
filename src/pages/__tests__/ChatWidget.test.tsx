import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ChatWidget } from "../../components/chatbot/ChatWidget";

describe("ChatWidget - Chatbot Support Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom doesn't implement scrollIntoView, so mock it
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders trigger button initially and opens chat window on click", () => {
    render(<ChatWidget />);
    
    // Renders trigger button
    const triggerBtn = screen.getByRole("button", { name: /open chat support/i });
    expect(triggerBtn).toBeInTheDocument();
    
    // Chat window should not be visible initially
    expect(screen.queryByText("PTE Study Assistant")).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(triggerBtn);

    // Chat window is displayed
    expect(screen.getByText("PTE Study Assistant")).toBeInTheDocument();
    expect(screen.getByText(/Hello! I am your PTE Exam Prep Assistant/i)).toBeInTheDocument();
  });

  it("navigates chatbot flow on option selection", () => {
    render(<ChatWidget />);
    
    // Open chat
    const triggerBtn = screen.getByRole("button", { name: /open chat support/i });
    fireEvent.click(triggerBtn);

    // Find and click "💰 Pricing Plans" option
    const pricingOption = screen.getByRole("button", { name: "💰 Pricing Plans" });
    fireEvent.click(pricingOption);

    // Should show user choice
    expect(screen.getByText("💰 Pricing Plans")).toBeInTheDocument();

    // Fast-forward timers for typing simulation (750ms)
    act(() => {
      vi.advanceTimersByTime(750);
    });

    // Should show the pricing response text
    expect(screen.getByText(/We offer tailored pricing plans to match your preparation level/i)).toBeInTheDocument();
    
    // Basic, Pro, and Premium options should be present
    expect(screen.getByRole("button", { name: "Basic Plan" })).toBeInTheDocument();
  });

  it("allows user to navigate back in option history", () => {
    render(<ChatWidget />);
    
    // Open chat
    fireEvent.click(screen.getByRole("button", { name: /open chat support/i }));

    // Click "💰 Pricing Plans"
    fireEvent.click(screen.getByRole("button", { name: "💰 Pricing Plans" }));
    act(() => { vi.advanceTimersByTime(750); });

    // Click "Basic Plan"
    fireEvent.click(screen.getByRole("button", { name: "Basic Plan" }));
    act(() => { vi.advanceTimersByTime(750); });

    expect(screen.getByText("Basic Plan (Fast Review)")).toBeInTheDocument();

    // Click "Back"
    const backBtn = screen.getByRole("button", { name: "Back" });
    fireEvent.click(backBtn);

    // Typing simulation (500ms)
    act(() => { vi.advanceTimersByTime(500); });

    // Should be back at the Pricing Plans main menu (should appear twice in message list)
    expect(screen.getAllByText(/We offer tailored pricing plans to match your preparation level/i).length).toBeGreaterThanOrEqual(2);
  });

  it("allows user to navigate back to main menu using Main Menu button", () => {
    render(<ChatWidget />);
    
    // Open chat
    fireEvent.click(screen.getByRole("button", { name: /open chat support/i }));

    // Click "💰 Pricing Plans"
    fireEvent.click(screen.getByRole("button", { name: "💰 Pricing Plans" }));
    act(() => { vi.advanceTimersByTime(750); });

    // Click "Basic Plan"
    fireEvent.click(screen.getByRole("button", { name: "Basic Plan" }));
    act(() => { vi.advanceTimersByTime(750); });

    // Click "Main Menu"
    const mainMenuBtn = screen.getByRole("button", { name: "Main Menu" });
    fireEvent.click(mainMenuBtn);

    // Typing simulation (600ms)
    act(() => { vi.advanceTimersByTime(600); });

    // Should be back at the home welcome message, meaning we have multiple instances in scroll history
    expect(screen.getAllByText(/Hello! I am your PTE Exam Prep Assistant/i).length).toBeGreaterThanOrEqual(2);
  });

  it("matches keywords in text inputs to trigger appropriate response flows", () => {
    render(<ChatWidget />);
    
    // Open chat
    fireEvent.click(screen.getByRole("button", { name: /open chat support/i }));

    // Type a keyword query: "how much is the premium pricing plan?"
    const input = screen.getByPlaceholderText("Type a keyword (e.g. pricing, scoring)...");

    fireEvent.change(input, { target: { value: "how much is the premium pricing plan?" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Should display the user message
    expect(screen.getByText("how much is the premium pricing plan?")).toBeInTheDocument();

    // Fast-forward timers for text submit simulation (850ms)
    act(() => {
      vi.advanceTimersByTime(850);
    });

    // Bold tags render as strong elements. Let's assert on broken fragments
    expect(screen.getByText(/I detected you are asking about/i)).toBeInTheDocument();
    expect(screen.getByText("PRICING")).toBeInTheDocument();
  });

  it("handles unrecognized user input with a fallback help response", () => {
    render(<ChatWidget />);
    
    // Open chat
    fireEvent.click(screen.getByRole("button", { name: /open chat support/i }));

    const input = screen.getByPlaceholderText("Type a keyword (e.g. pricing, scoring)...");

    fireEvent.change(input, { target: { value: "xyzabc123" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    act(() => {
      vi.advanceTimersByTime(850);
    });

    // Fallback response should be displayed
    expect(screen.getByText(/I couldn't find a direct match for that/i)).toBeInTheDocument();
  });

  it("minimizes the chat window and restores it on click", () => {
    render(<ChatWidget />);
    
    // Open chat
    fireEvent.click(screen.getByRole("button", { name: /open chat support/i }));

    // Click minimize
    const minimizeBtn = screen.getByTitle("Minimize Chat");
    fireEvent.click(minimizeBtn);

    // Chat window should be hidden, minimized button should be shown
    expect(screen.queryByText("PTE Study Assistant")).not.toBeInTheDocument();
    
    const minimizedBtn = screen.getByRole("button", { name: /PTE Chat Support/i });
    expect(minimizedBtn).toBeInTheDocument();

    // Click to restore
    fireEvent.click(minimizedBtn);
    expect(screen.getByText("PTE Study Assistant")).toBeInTheDocument();
  });

  it("closes the chat widget entirely when close button is clicked", () => {
    render(<ChatWidget />);
    
    // Open chat
    fireEvent.click(screen.getByRole("button", { name: /open chat support/i }));

    // Click close
    const closeBtn = screen.getByTitle("Close Chat");
    fireEvent.click(closeBtn);

    // Chat window is hidden and trigger button is visible again
    expect(screen.queryByText("PTE Study Assistant")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open chat support/i })).toBeInTheDocument();
  });
});
