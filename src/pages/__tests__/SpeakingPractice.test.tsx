import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { SpeakingPractice } from "../SpeakingPractice";

describe("SpeakingPractice", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders the heading and question type for the first question", () => {
    render(<SpeakingPractice />);
    expect(screen.getByText("Speaking Practice")).toBeInTheDocument();
    expect(screen.getByText("Read Aloud")).toBeInTheDocument();
    expect(screen.getByText(/Industrial Revolution/)).toBeInTheDocument();
  });

  it("shows preparation timer and counts down to recording", () => {
    render(<SpeakingPractice />);
    expect(screen.getByText("40s")).toBeInTheDocument();
    expect(screen.getAllByText(/Preparation Time/i).length).toBeGreaterThan(0);

    // Fast-forward preparation time (40 seconds)
    act(() => {
      vi.advanceTimersByTime(40000);
    });

    expect(screen.getByText("Recording")).toBeInTheDocument();
    expect(screen.getByText("40s")).toBeInTheDocument();
  });

  it("counts down recording to playback, then loads AI evaluation scores after delay", () => {
    render(<SpeakingPractice />);
    
    // Fast-forward preparation time
    act(() => {
      vi.advanceTimersByTime(40000);
    });

    // Fast-forward recording time (40 seconds)
    act(() => {
      vi.advanceTimersByTime(40000);
    });

    expect(screen.getByText("Your Recording")).toBeInTheDocument();

    // Fast-forward 2 seconds for scores to load
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText("AI Evaluation")).toBeInTheDocument();
    expect(screen.getByText("Pronunciation")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument(); // Pronunciation score
  });

  it("resets state when Reset button is clicked during playback", () => {
    render(<SpeakingPractice />);
    
    // Fast-forward prep + recording time to reach playback
    act(() => {
      vi.advanceTimersByTime(40000);
    });
    act(() => {
      vi.advanceTimersByTime(40000);
    });

    expect(screen.getByText("Your Recording")).toBeInTheDocument();

    // Click the Reset (rotate) button
    const rotateBtn = document.querySelector("svg.lucide-rotate-ccw")?.parentElement;
    if (rotateBtn) {
      fireEvent.click(rotateBtn);
      expect(screen.queryByText("Your Recording")).not.toBeInTheDocument();
      expect(screen.getByText("40s")).toBeInTheDocument();
    }
  });

  it("renders Repeat Sentence and handles Audio Play button", () => {
    render(<SpeakingPractice />);
    
    // Advance to Repeat Sentence question (index 2)
    const nextBtn = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);

    expect(screen.getByText("Repeat Sentence")).toBeInTheDocument();
    
    // Check Play Audio button is visible
    const playAudioBtn = screen.getByRole("button", { name: /Play Audio/i });
    expect(playAudioBtn).toBeInTheDocument();
    
    fireEvent.click(playAudioBtn);

    // Fast-forward prep timer (3 seconds for Repeat Sentence)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText("Recording")).toBeInTheDocument();
  });

  it("renders Describe Image question and details", () => {
    render(<SpeakingPractice />);
    
    // Advance to Describe Image question (index 3)
    const nextBtn = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);

    expect(screen.getByText("Describe Image")).toBeInTheDocument();
    expect(screen.getByAltText("Describe this")).toBeInTheDocument();
  });

  it("handles Previous button click", () => {
    render(<SpeakingPractice />);
    
    const nextBtn = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Climate change/)).toBeInTheDocument();

    const prevBtn = screen.getByRole("button", { name: /previous/i });
    fireEvent.click(prevBtn);
    expect(screen.getByText(/Industrial Revolution/)).toBeInTheDocument();
  });

  it("toasts success when next button is clicked on the last question", async () => {
    const { toast } = await import("sonner");
    render(<SpeakingPractice />);
    
    const nextBtn = screen.getByRole("button", { name: /next/i });
    // sampleQuestions has 4 questions, so we click Next 3 times to get to the 4th, then 1 more time
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);

    expect(toast.success).toHaveBeenCalledWith("Practice session completed!");
  });
});
