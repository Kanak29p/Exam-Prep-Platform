import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { WritingPractice } from "../WritingPractice";

describe("WritingPractice", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders heading and the first question's type and text", () => {
    render(<WritingPractice />);
    expect(screen.getByText("Writing Practice")).toBeInTheDocument();
    expect(
      screen.getByText("Summarize Written Text"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Artificial Intelligence has revolutionized/i),
    ).toBeInTheDocument();
  });

  it("disables submit when textarea is empty", () => {
    render(<WritingPractice />);
    expect(screen.getByRole("button", { name: /submit answer/i })).toBeDisabled();
  });

  it("toasts an error when word count is below the minimum", async () => {
    const { toast } = await import("sonner");
    render(<WritingPractice />);
    const textarea = screen.getByPlaceholderText(/Start writing your/i);
    fireEvent.change(textarea, { target: { value: "Tiny" } });
    fireEvent.click(screen.getByRole("button", { name: /submit answer/i }));
    expect(toast.error).toHaveBeenCalledWith(
      "Word count must be between 5 and 75 words",
    );
  });

  it("toasts success when valid answer is submitted and renders AI feedback after delay", async () => {
    const { toast } = await import("sonner");
    render(<WritingPractice />);
    const textarea = screen.getByPlaceholderText(/Start writing your/i);
    fireEvent.change(textarea, {
      target: {
        value: "AI has transformed numerous industries with great potential.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit answer/i }));
    expect(toast.success).toHaveBeenCalledWith(
      "Answer submitted! AI is evaluating...",
    );

    // Fast-forward 2 seconds for AI score mock delay
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText("AI Evaluation Results")).toBeInTheDocument();
    expect(screen.getByText("Overall")).toBeInTheDocument();
    expect(screen.getByText("Grammar Corrections:")).toBeInTheDocument();
  });

  it("triggers auto submit when time limit expires", async () => {
    const { toast } = await import("sonner");
    render(<WritingPractice />);
    
    const textarea = screen.getByPlaceholderText(/Start writing your/i);
    fireEvent.change(textarea, {
      target: {
        value: "This is a valid summary statement that should be submitted.",
      },
    });

    // Fast-forward 600 seconds (10 minutes)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600000);
    });

    expect(toast.success).toHaveBeenCalledWith(
      "Answer submitted! AI is evaluating...",
    );
  });

  it("does not auto submit when time limit expires if answer is empty", async () => {
    const { toast } = await import("sonner");
    render(<WritingPractice />);
    
    // Fast-forward 600 seconds (10 minutes)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600000);
    });

    expect(toast.success).not.toHaveBeenCalled();
  });

  it("navigates to the second question via Next", () => {
    render(<WritingPractice />);
    
    // Check Next button
    const nextBtn = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextBtn);
    
    expect(screen.getByText("Essay")).toBeInTheDocument();
    expect(
      screen.getByText(/social media has made us more connected/i),
    ).toBeInTheDocument();
  });

  it("navigates back via Previous", () => {
    render(<WritingPractice />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(screen.getByText("Summarize Written Text")).toBeInTheDocument();
  });
});
