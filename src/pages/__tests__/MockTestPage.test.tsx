import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../components/organisms/AudioRecorder", () => ({
  AudioRecorder: ({ onUploadSuccess }: any) => (
    <div data-testid="audio-recorder">
      <button onClick={() => onUploadSuccess("http://audio.url", "spoken transcript")}>
        Upload Audio
      </button>
    </div>
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { MockTestPage } from "../MockTestPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <MockTestPage />
    </MemoryRouter>,
  );
}

const sampleTest = {
  ID: 1,
  TITLE: "PTE Mock Test 1",
  DESCRIPTION: "Full mock",
  TOTAL_QUESTIONS: 3,
  TOTAL_DURATION_MINUTES: 120,
  STATUS: "active",
};

const sampleQuestions = [
  {
    ID: 101,
    QUESTION_TEXT: "Speaking read aloud sentence.",
    CATEGORY: "Speaking",
    SUB_CATEGORY: "Read Aloud",
    RECORDING_TIME: 10,
    RECORDING_WAITING_TIME: 2,
  },
  {
    ID: 102,
    QUESTION_TEXT: "Writing essay topic.",
    CATEGORY: "Writing",
    SUB_CATEGORY: "Write Essay",
  },
  {
    ID: 103,
    QUESTION_TEXT: "Reading choice text.",
    CATEGORY: "Reading",
    SUB_CATEGORY: "Multiple Choice Single Answer",
    OPTIONS: JSON.stringify(["Option A", "Option B"]),
    CORRECT_ANSWER: "Option A",
  },
];

const pendingAttempt = {
  ID: "att_pending",
  MOCK_TEST_ID: 1,
  TITLE: "PTE Mock Test 1",
  STATUS: "pending",
  CURRENT_QUESTION_INDEX: 1,
  TIME_REMAINING: 3600,
  QUESTIONS: JSON.stringify(sampleQuestions),
  GRADES: JSON.stringify({
    0: { score: 90, feedback: "Great", accuracy: 100, userResponse: "Spoken text" },
  }),
};

const completedAttempt = {
  ID: "att_completed",
  MOCK_TEST_ID: 1,
  TITLE: "PTE Mock Test 1",
  STATUS: "completed",
  OVERALL_SCORE: 82,
  SPEAKING_SCORE: 90,
  WRITING_SCORE: 75,
  READING_SCORE: 80,
  LISTENING_SCORE: 83,
  QUESTIONS: JSON.stringify(sampleQuestions),
  GRADES: JSON.stringify({
    0: { score: 90, feedback: "Great", accuracy: 100, userResponse: "Spoken text" },
    1: { score: 75, feedback: "Good essay", accuracy: 80, userResponse: "Essay response" },
    2: { score: 80, feedback: "Correct", accuracy: 100, userResponse: "Option A" },
  }),
};

beforeEach(() => {
  localStorage.setItem("token", "tok");
  
  // Use URL-based mapping for fetch to make it completely deterministic and immune to timing order
  vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string, init?: any) => {
    if (url.includes("/api/mock-tests/attempts")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => [],
      });
    }
    if (url.includes("/api/mock-tests")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => [sampleTest],
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
  }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("MockTestPage - Basic tests", () => {
  it("shows loader during initial fetch", () => {
    (globalThis.fetch as any).mockImplementation(() => new Promise(() => undefined));
    renderPage();
    expect(screen.getByText(/Querying database/i)).toBeInTheDocument();
  });

  it("shows empty state when no tests are available", async () => {
    (globalThis.fetch as any).mockImplementation((url: string) => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => [],
      });
    });

    renderPage();
    await waitFor(() =>
      expect(screen.getByText("No mock tests available")).toBeInTheDocument(),
    );
  });

  it("renders the test list when API returns tests", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("PTE Mock Test 1")).toBeInTheDocument(),
    );
    expect(screen.getByText("120 Minutes")).toBeInTheDocument();
    expect(screen.getByText("3 Questions Patterned")).toBeInTheDocument();
  });

  it("opens start confirmation when Start Test is clicked", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /start test/i })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /start test/i }));
    await waitFor(() =>
      expect(
        screen.getAllByText(/PTE Mock Test 1/).length,
      ).toBeGreaterThanOrEqual(2),
    );
  });

  it("switches to Pending tab and shows empty pending state", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/Pending Exams/i)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /Pending Exams/i }));
    expect(screen.getByText("No pending tests")).toBeInTheDocument();
  });

  it("toasts when fetching tests fails", async () => {
    const { toast } = await import("sonner");
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes("/api/mock-tests/attempts")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => [] });
      }
      return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
    });

    renderPage();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to load mock tests from database.",
      ),
    );
  });
});

describe("MockTestPage - Active Exam Sequence", () => {
  it("runs full mock test from start to score report", async () => {
    const { toast } = await import("sonner");

    (globalThis.fetch as any).mockImplementation((url: string, init?: any) => {
      if (url.includes("/attempts/1/start")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            id: "att_1",
            questions: sampleQuestions,
          }),
        });
      }
      if (url.includes("/api/questions/submit")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ score: 85, accuracy: 90, feedback: "Good effort" }),
        });
      }
      if (url.includes("/attempts/att_1/progress")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      }
      if (url.includes("/attempts/att_1/submit")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      }
      if (url.includes("/api/mock-tests/attempts")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => [] });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => [sampleTest],
      });
    });

    renderPage();
    await waitFor(() => expect(screen.getByText("PTE Mock Test 1")).toBeInTheDocument());

    // Click Start
    fireEvent.click(screen.getByRole("button", { name: /start test/i }));

    // Confirm Start in modal
    fireEvent.click(screen.getByRole("button", { name: /Start Now/i }));

    // Verify first question (Speaking) loaded
    await waitFor(() => expect(screen.getByText("Speaking read aloud sentence.")).toBeInTheDocument());

    // 1. Submit speaking answer
    fireEvent.click(screen.getByRole("button", { name: /Upload Audio/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Audio response submitted and graded successfully!"));

    // Click Next
    fireEvent.click(screen.getByRole("button", { name: /Next Question/i }));

    // Verify second question (Writing) loaded
    await waitFor(() => expect(screen.getByText("Writing essay topic.")).toBeInTheDocument());

    // Type essay response
    const textarea = screen.getByPlaceholderText("Type your response here...");
    fireEvent.change(textarea, { target: { value: "This is essay response from user." } });

    // Submit writing answer
    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Answer locked and submitted successfully!"));

    // Click Next
    fireEvent.click(screen.getByRole("button", { name: /Next Question/i }));

    // Verify third question (Reading) loaded
    await waitFor(() => expect(screen.getByText("Reading choice text.")).toBeInTheDocument());

    // Select MCQ Single Answer
    fireEvent.click(screen.getByText("Option A"));

    // Submit reading answer
    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Answer locked and submitted successfully!"));

    // Click Finish Test
    fireEvent.click(screen.getByRole("button", { name: /Finish Test/i }));

    // Verify report page is shown
    await waitFor(() => expect(screen.getByText("Question Evaluation Report")).toBeInTheDocument());
  });

  it("resumes a pending test attempt", async () => {
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes("/api/mock-tests/attempts")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [pendingAttempt],
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => [sampleTest],
      });
    });

    renderPage();

    await waitFor(() => expect(screen.getByText(/Pending Exams/i)).toBeInTheDocument());
    
    // Switch to Pending tab
    fireEvent.click(screen.getByRole("button", { name: /Pending Exams/i }));

    await waitFor(() => expect(screen.getByText("Resume Test")).toBeInTheDocument());

    // Click Resume
    fireEvent.click(screen.getByText("Resume Test"));

    // Check we loaded active exam from question index 1 (Writing)
    await waitFor(() => expect(screen.getByText("Writing essay topic.")).toBeInTheDocument());
  });

  it("views report for a completed attempt", async () => {
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes("/api/mock-tests/attempts")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [completedAttempt],
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => [sampleTest],
      });
    });

    renderPage();

    await waitFor(() => expect(screen.getByText(/Completed Attempts/i)).toBeInTheDocument());
    
    // Switch to Completed tab
    fireEvent.click(screen.getByRole("button", { name: /Completed Attempts/i }));

    await waitFor(() => expect(screen.getByText("View Report")).toBeInTheDocument());

    // Click View Report
    fireEvent.click(screen.getByText("View Report"));

    // Verify Score Report Modal/Layout opens
    await waitFor(() => expect(screen.getByText("Question Evaluation Report")).toBeInTheDocument());
  });
});

describe("MockTestPage - Comprehensive Exam Sequence & Edge Cases", () => {
  const sampleQuestions2 = [
    {
      ID: 201,
      QUESTION_TEXT: "MCQ Multiple options: Choice A, Choice B, Choice C.",
      CATEGORY: "Reading",
      SUB_CATEGORY: "Multiple Choice Multiple Answer",
      OPTIONS: JSON.stringify(["Choice A", "Choice B", "Choice C"]),
    },
    {
      ID: 202,
      QUESTION_TEXT: "Reorder options: Para A, Para B.",
      CATEGORY: "Reading",
      SUB_CATEGORY: "Reorder Paragraphs",
      OPTIONS: JSON.stringify(["Para A", "Para B"]),
    },
    {
      ID: 203,
      QUESTION_TEXT: "Select blanks here __ and __.",
      CATEGORY: "Reading",
      SUB_CATEGORY: "Reading & Writing: Fill in the Blanks",
      OPTIONS: JSON.stringify(["word1", "word2"]),
    },
    {
      ID: 204,
      QUESTION_TEXT: "Drag blanks here __.",
      CATEGORY: "Reading",
      SUB_CATEGORY: "Reading: Fill in the Blanks",
      OPTIONS: JSON.stringify(["drag1"]),
    },
    {
      ID: 205,
      QUESTION_TEXT: "Highlight incorrect: \"This is incorrect sentence.\"",
      CATEGORY: "Listening",
      SUB_CATEGORY: "Highlight Incorrect Words",
    },
    {
      ID: 206,
      QUESTION_TEXT: "Write from dictation text.",
      CATEGORY: "Listening",
      SUB_CATEGORY: "Write From Dictation",
    }
  ];

  beforeEach(() => {
    localStorage.setItem("token", "tok");
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string, init?: any) => {
      if (url.includes("/attempts/1/start")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            id: "att_2",
            questions: sampleQuestions2,
          }),
        });
      }
      if (url.includes("/api/questions/submit")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ score: 85, accuracy: 90, feedback: "Good effort" }),
        });
      }
      if (url.includes("/attempts/att_2/progress") || url.includes("/attempts/att_2/submit")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      }
      if (url.includes("/api/mock-tests/attempts")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => [] });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => [sampleTest],
      });
    }));
  });

  it("handles start test modal cancellation", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /start test/i })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /start test/i }));
    
    await waitFor(() => expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(screen.queryByRole("button", { name: /Start Now/i })).not.toBeInTheDocument();
  });

  it("handles progress saving network failures gracefully", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes("/progress")) {
        return Promise.reject(new Error("Network Error"));
      }
      if (url.includes("/attempts/1/start")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ id: "att_2", questions: sampleQuestions2 }) });
      }
      if (url.includes("/api/mock-tests/attempts")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => [] });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => [sampleTest] });
    });

    renderPage();
    await waitFor(() => expect(screen.getByRole("button", { name: /start test/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /start test/i }));
    fireEvent.click(screen.getByRole("button", { name: /Start Now/i }));

    await waitFor(() => expect(screen.getByText("MCQ Multiple options: Choice A, Choice B, Choice C.")).toBeInTheDocument());
    
    // Jump to next question which triggers saveProgress
    fireEvent.click(screen.getByRole("button", { name: /Next Question/i }));
    
    await waitFor(() => {
      expect(errSpy).toHaveBeenCalled();
    });
    errSpy.mockRestore();
  });

  it("handles grading server HTTP error fallbacks", async () => {
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes("/api/questions/submit")) {
        return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
      }
      if (url.includes("/attempts/1/start")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ id: "att_2", questions: sampleQuestions2 }) });
      }
      if (url.includes("/api/mock-tests/attempts")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => [] });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => [sampleTest] });
    });

    renderPage();
    await waitFor(() => expect(screen.getByRole("button", { name: /start test/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /start test/i }));
    fireEvent.click(screen.getByRole("button", { name: /Start Now/i }));

    await waitFor(() => expect(screen.getByText("MCQ Multiple options: Choice A, Choice B, Choice C.")).toBeInTheDocument());
    
    fireEvent.click(screen.getByText("Choice A"));
    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));

    // Submission should fail but page shouldn't crash
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("runs MCQ Multiple, Reorder, FITB, Highlight Incorrect Word, Dictation questions", async () => {
    const { container } = renderPage();
    await waitFor(() => expect(screen.getByRole("button", { name: /start test/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /start test/i }));
    fireEvent.click(screen.getByRole("button", { name: /Start Now/i }));

    // 1. MCQ Multiple
    await waitFor(() => expect(screen.getByText("MCQ Multiple options: Choice A, Choice B, Choice C.")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Choice A"));
    fireEvent.click(screen.getByText("Choice B"));
    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));
    await screen.findByRole("button", { name: /Next Question/i });
    fireEvent.click(screen.getByRole("button", { name: /Next Question/i }));

    // 2. Reorder
    await waitFor(() => expect(screen.getByText("Reorder options: Para A, Para B.")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Para A"));
    fireEvent.click(screen.getByText("Para B"));
    fireEvent.click(screen.getByText("Para A")); // click to remove
    fireEvent.click(screen.getByText("Para A")); // re-add
    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));
    await screen.findByRole("button", { name: /Next Question/i });
    fireEvent.click(screen.getByRole("button", { name: /Next Question/i }));

    // 3. Dropdown FITB
    await waitFor(() => expect(screen.getByText("Select blanks here")).toBeInTheDocument());
    const select = screen.getAllByRole("combobox")[0];
    fireEvent.change(select, { target: { value: "word1" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));
    await screen.findByRole("button", { name: /Next Question/i });
    fireEvent.click(screen.getByRole("button", { name: /Next Question/i }));

    // 4. Drag & Drop FITB
    await waitFor(() => expect(screen.getByText("Drag blanks here")).toBeInTheDocument());
    const dragBtn = screen.getByRole("button", { name: "drag1" });
    fireEvent.click(dragBtn);
    const blankBox = container.querySelector("span.border-dashed")!;
    fireEvent.click(blankBox);
    fireEvent.click(blankBox); // Click placed word to remove it
    fireEvent.click(dragBtn); // Place again
    fireEvent.click(blankBox);
    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));
    await screen.findByRole("button", { name: /Next Question/i });
    fireEvent.click(screen.getByRole("button", { name: /Next Question/i }));

    // 5. Highlight Incorrect Word
    await waitFor(() => expect(screen.getByText("Highlight Incorrect Words")).toBeInTheDocument());
    fireEvent.click(screen.getAllByText(/incorrect/i)[0]);
    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));
    await screen.findByRole("button", { name: /Next Question/i });
    fireEvent.click(screen.getByRole("button", { name: /Next Question/i }));

    // 6. Dictation
    await waitFor(() => expect(screen.getByText("Write from dictation text.")).toBeInTheDocument());
    const textarea = screen.getByPlaceholderText(/Type your transcription response here/i);
    fireEvent.change(textarea, { target: { value: "transcribed response" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));
    await screen.findByRole("button", { name: /Finish Test/i });
    fireEvent.click(screen.getByRole("button", { name: /Finish Test/i }));

    // Report
    await waitFor(() => expect(screen.getByText("Question Evaluation Report")).toBeInTheDocument());
  });

  it("handles timer auto-submit when remaining time reaches 0", async () => {
    vi.useFakeTimers();
    const customTest = {
      ...sampleTest,
      TOTAL_DURATION_MINUTES: 1 / 60, // 1 second
    };
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string, init?: any) => {
      if (url.includes("/attempts/1/start")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            id: "att_2",
            questions: sampleQuestions2,
          }),
        });
      }
      if (url.includes("/api/mock-tests/attempts")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => [] });
      }
      if (url.includes("/attempts/att_2/progress") || url.includes("/attempts/att_2/submit")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => [customTest],
      });
    }));

    renderPage();

    // Flush mock fetches on mount
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(screen.getByRole("button", { name: /start test/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /start test/i }));

    // Flush updates so selectedTest is updated and modal shows
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    fireEvent.click(screen.getByRole("button", { name: /Start Now/i }));

    // Resolve start attempt promise
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(screen.getByText("MCQ Multiple options: Choice A, Choice B, Choice C.")).toBeInTheDocument();

    // Advance by 2 more seconds to trigger countdown timeout auto submit
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByText("Question Evaluation Report")).toBeInTheDocument();
  });

  it("handles quitting the test and saving progress", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    renderPage();
    await waitFor(() => expect(screen.getByRole("button", { name: /start test/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /start test/i }));
    fireEvent.click(screen.getByRole("button", { name: /Start Now/i }));

    await waitFor(() => expect(screen.getByText("MCQ Multiple options: Choice A, Choice B, Choice C.")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Quit Test/i }));

    await waitFor(() => expect(screen.getByText("PTE Mock Test 1")).toBeInTheDocument());
  });
});
