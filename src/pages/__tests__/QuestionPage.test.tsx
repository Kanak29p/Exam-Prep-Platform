import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../../components/organisms/AudioRecorder", () => ({
  AudioRecorder: ({ onRecordingStart, onRecordingComplete, onUploadSuccess }: any) => (
    <div data-testid="audio-recorder">
      <button onClick={onRecordingStart}>Start Rec</button>
      <button onClick={onRecordingComplete}>Complete Rec</button>
      <button onClick={() => onUploadSuccess("http://audio.url", "spoken transcript")}>
        Upload Rec
      </button>
    </div>
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { QuestionPage } from "../QuestionPage";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/practice/:module/:section/:questionId"
          element={<QuestionPage />}
        />
        <Route
          path="/practice/:module/:section"
          element={<QuestionPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.setItem("token", "tok");
  vi.stubGlobal("fetch", vi.fn());
});

describe("QuestionPage - Basic and Navigation tests", () => {
  it("shows loading skeleton initially", () => {
    (globalThis.fetch as any).mockImplementation(() => new Promise(() => undefined));
    const { container } = renderAt("/practice/speaking/read-aloud/1");
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders the question after fetch resolves", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          instruction: "Read this aloud",
          question: {
            QUESTIONID: 1,
            QUESTION_TEXT: "The quick brown fox.",
            CATEGORY: "Speaking",
            SUB_CATEGORY: "Read Aloud",
            TITLE: "Sample",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ QUESTIONID: 1 }],
      });

    renderAt("/practice/speaking/read-aloud/1");

    await waitFor(() =>
      expect(screen.getByText(/quick brown fox/i)).toBeInTheDocument(),
    );
  });

  it("clears localStorage and reloads on 401", async () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    });

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    renderAt("/practice/speaking/read-aloud/1");
    await waitFor(() => expect(reloadSpy).toHaveBeenCalled());
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("logs error when fetch rejects", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    (globalThis.fetch as any).mockRejectedValue(new Error("network"));

    renderAt("/practice/speaking/read-aloud/1");
    await waitFor(() => expect(errorSpy).toHaveBeenCalled());
    errorSpy.mockRestore();
  });

  it("does not fetch when questionId is missing", async () => {
    renderAt("/practice/speaking/read-aloud");
    await new Promise((r) => setTimeout(r, 30));
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe("QuestionPage - Reading & Listening MCQs", () => {
  it("interacts and submits MCQ Single Choice question", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          instruction: "Choose one",
          question: {
            QUESTIONID: 2,
            QUESTION_TEXT: "Choose the correct country.",
            CATEGORY: "Reading",
            SUB_CATEGORY: "Multiple Choice Single Answer",
            OPTIONS: JSON.stringify(["India", "Australia", "Canada"]),
            CORRECT_ANSWER: "India",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ QUESTIONID: 2 }],
      });

    renderAt("/practice/reading/single-answer/2");

    await waitFor(() => expect(screen.getByText("Choose the correct country.")).toBeInTheDocument());

    // Click Australia option
    const australiaOption = screen.getByText("Australia");
    fireEvent.click(australiaOption);

    // Mock submission endpoint
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        score: 0,
        accuracy: 0,
        feedback: "Incorrect, correct is India",
      }),
    });

    // Click Submit
    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));

    await waitFor(() => expect(screen.getByText("Evaluation Summary")).toBeInTheDocument());
    expect(screen.getByText(/0 \/ 90/)).toBeInTheDocument();
    expect(screen.getByText("Incorrect, correct is India")).toBeInTheDocument();

    // Click Retry
    fireEvent.click(screen.getByRole("button", { name: /Retry \/ Practice Again/i }));
    expect(screen.queryByText("Evaluation Summary")).not.toBeInTheDocument();
  });

  it("interacts and submits MCQ Multiple Choice question", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          instruction: "Choose multiple",
          question: {
            QUESTIONID: 3,
            QUESTION_TEXT: "Select nouns.",
            CATEGORY: "Listening",
            SUB_CATEGORY: "Multiple Choice Multiple Answers",
            OPTIONS: JSON.stringify(["Apple", "Run", "Banana", "Quick"]),
            CORRECT_ANSWER: "Apple, Banana",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ QUESTIONID: 3 }],
      });

    renderAt("/practice/listening/multiple-answers/3");

    await waitFor(() => expect(screen.getByText("Select nouns.")).toBeInTheDocument());

    // Toggle options
    fireEvent.click(screen.getByText("Apple"));
    fireEvent.click(screen.getByText("Banana"));
    // Deselect and re-select
    fireEvent.click(screen.getByText("Run"));
    fireEvent.click(screen.getByText("Run"));

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        score: 90,
        accuracy: 100,
        feedback: "Excellent!",
      }),
    });

    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));

    await waitFor(() => expect(screen.getByText("Evaluation Summary")).toBeInTheDocument());
    expect(screen.getByText(/90 \/ 90/)).toBeInTheDocument();
  });
});

describe("QuestionPage - Reorder and Incorrect Word", () => {
  it("interacts and submits Reorder Paragraph question", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          instruction: "Reorder these",
          question: {
            QUESTIONID: 4,
            QUESTION_TEXT: "Paragraph reorder prompt",
            CATEGORY: "Reading",
            SUB_CATEGORY: "Reorder Paragraphs",
            OPTIONS: JSON.stringify(["A) sentence 1", "B) sentence 2", "C) sentence 3"]),
            CORRECT_ANSWER: "A → B → C",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ QUESTIONID: 4 }],
      });

    renderAt("/practice/reading/reorder/4");

    await waitFor(() => expect(screen.getByText("Paragraph reorder prompt")).toBeInTheDocument());

    // Click scrambled paragraphs to order them
    fireEvent.click(screen.getByText("A) sentence 1"));
    fireEvent.click(screen.getByText("B) sentence 2"));
    fireEvent.click(screen.getByText("C) sentence 3"));

    // Remove sentence 2
    fireEvent.click(screen.getAllByRole("button", { name: /sentence 2/i })[0]);

    // Re-add sentence 2
    fireEvent.click(screen.getByText("B) sentence 2"));

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        score: 90,
        accuracy: 100,
      }),
    });

    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));
    await waitFor(() => expect(screen.getByText("Evaluation Summary")).toBeInTheDocument());
  });

  it("interacts and submits Highlight Incorrect Word question", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          instruction: "Select incorrect",
          question: {
            QUESTIONID: 5,
            QUESTION_TEXT: 'Text: "I went to school yesterday"',
            CATEGORY: "Listening",
            SUB_CATEGORY: "Highlight Incorrect Words",
            CORRECT_ANSWER: "school",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ QUESTIONID: 5 }],
      });

    renderAt("/practice/listening/incorrect-words/5");

    await waitFor(() => expect(screen.getByText("Select incorrect")).toBeInTheDocument());

    // Click word "school"
    fireEvent.click(screen.getByText("school"));

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        score: 90,
        accuracy: 100,
      }),
    });

    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));
    await waitFor(() => expect(screen.getByText("Evaluation Summary")).toBeInTheDocument());
  });
});

describe("QuestionPage - Fill in the Blanks", () => {
  it("submits Dropdown type Fill in the Blanks", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          instruction: "Fill in blanks",
          question: {
            QUESTIONID: 6,
            QUESTION_TEXT: '"The ___ chased the mouse" Options: cat, dog',
            CATEGORY: "Reading",
            SUB_CATEGORY: "Reading & Writing: Fill in the Blanks",
            CORRECT_ANSWER: "cat",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ QUESTIONID: 6 }],
      });

    renderAt("/practice/reading/dropdown-fill/6");

    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());

    // Select dropdown option
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "cat" } });

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ score: 90, accuracy: 100 }),
    });

    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));
    await waitFor(() => expect(screen.getByText("Evaluation Summary")).toBeInTheDocument());
  });

  it("submits Drag and Drop type Fill in the Blanks", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          instruction: "Drag and drop blanks",
          question: {
            QUESTIONID: 7,
            QUESTION_TEXT: '"It is hot in ___" Options: summer, winter',
            CATEGORY: "Reading",
            SUB_CATEGORY: "reading fill in the blanks",
            CORRECT_ANSWER: "summer",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ QUESTIONID: 7 }],
      });

    const { container } = renderAt("/practice/reading/drag-fill/7");

    await waitFor(() => expect(screen.getByText("summer")).toBeInTheDocument());

    // Click word then click blank
    fireEvent.click(screen.getByText("summer"));
    const blankBox = container.querySelector("span.inline-block");
    expect(blankBox).toBeInTheDocument();
    fireEvent.click(blankBox!);

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ score: 90, accuracy: 100 }),
    });

    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));
    await waitFor(() => expect(screen.getByText("Evaluation Summary")).toBeInTheDocument());
  });

  it("submits Input text type Fill in the Blanks", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          instruction: "Type in blanks",
          question: {
            QUESTIONID: 8,
            QUESTION_TEXT: 'Text: "Two ___ two is four"',
            CATEGORY: "Listening",
            SUB_CATEGORY: "Listening: Fill in the Blanks",
            CORRECT_ANSWER: "plus",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ QUESTIONID: 8 }],
      });

    renderAt("/practice/listening/input-fill/8");

    await waitFor(() => expect(screen.getByRole("textbox")).toBeInTheDocument());

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "plus" } });

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ score: 90, accuracy: 100 }),
    });

    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));
    await waitFor(() => expect(screen.getByText("Evaluation Summary")).toBeInTheDocument());
  });
});

describe("QuestionPage - Writing Sections", () => {
  it("handles Write Essay validation and submission", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          instruction: "Write an essay",
          question: {
            QUESTIONID: 9,
            QUESTION_TEXT: "Should public transport be free?",
            CATEGORY: "Writing",
            SUB_CATEGORY: "Write Essay",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ QUESTIONID: 9 }],
      });

    renderAt("/practice/writing/essay/9");

    await waitFor(() => expect(screen.getByText("Should public transport be free?")).toBeInTheDocument());

    const textarea = screen.getByPlaceholderText("Type your answer here...");
    fireEvent.change(textarea, { target: { value: "Some essay content goes here" } });

    // Verify word count updates
    expect(screen.getByText("5")).toBeInTheDocument(); // 5 words

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));

    await waitFor(() => expect(screen.getByText("Submission Review")).toBeInTheDocument());
  });

  it("validates single sentence for Summarize Written Text", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          instruction: "Summarize this",
          question: {
            QUESTIONID: 10,
            QUESTION_TEXT: "A long passage here.",
            CATEGORY: "Writing",
            SUB_CATEGORY: "Summarize Written Text",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ QUESTIONID: 10 }],
      });

    renderAt("/practice/writing/summarize/10");

    await waitFor(() => expect(screen.getByText("A long passage here.")).toBeInTheDocument());

    const textarea = screen.getByPlaceholderText("Type your answer here...");
    
    // Type multiple sentences
    fireEvent.change(textarea, { target: { value: "This is first sentence. This is second sentence." } });

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));

    await waitFor(() => expect(screen.getByText("Multiple sentences detected")).toBeInTheDocument());
    expect(screen.getByText(/contains approximately 2 sentences/)).toBeInTheDocument();
  });
});

describe("QuestionPage - Speaking Timers", () => {
  it("progresses timer stages and accepts AudioRecorder uploads", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          instruction: "Read Aloud",
          question: {
            QUESTIONID: 11,
            QUESTION_TEXT: "Read this sentence aloud.",
            CATEGORY: "Speaking",
            SUB_CATEGORY: "Read Aloud",
            RECORDING_TIME: 10,
            RECORDING_WAITING_TIME: 5,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ QUESTIONID: 11 }],
      });

    renderAt("/practice/speaking/read-aloud/11");

    await waitFor(() => expect(screen.getByText("Read this sentence aloud.")).toBeInTheDocument());

    // Stage initially is rec-countdown because there's no audio_url and recWait is > 0
    expect(screen.getByText("Preparation Time...")).toBeInTheDocument();

    // Trigger recorder mock start
    fireEvent.click(screen.getByText("Start Rec"));
    expect(screen.getByText("Recording Active...")).toBeInTheDocument();

    // Complete recording
    fireEvent.click(screen.getByText("Complete Rec"));
    expect(screen.getByText("Recording Complete")).toBeInTheDocument();

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        score: 75,
        accuracy: 80,
        feedback: "Good pronunciation",
        matchedWords: ["Read", "this"],
        missedWords: ["sentence"],
      }),
    });

    // Upload
    fireEvent.click(screen.getByText("Upload Rec"));

    await waitFor(() => expect(screen.getByText("Speaking Score & Evaluation")).toBeInTheDocument());
    expect(screen.getByText("75 / 90")).toBeInTheDocument();
    expect(screen.getByText("Matched Words (2)")).toBeInTheDocument();
    expect(screen.getByText("Missed / Mispronounced Words (1)")).toBeInTheDocument();
  });

  it("handles audio autoplay failure", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          instruction: "Read Aloud",
          question: {
            QUESTIONID: 12,
            QUESTION_TEXT: "Autoplay error test text.",
            CATEGORY: "Speaking",
            SUB_CATEGORY: "Read Aloud",
            AUDIO_URL: "http://test.audio",
            RECORDING_WAITING_TIME: 5,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ QUESTIONID: 12 }],
      });

    // Mock HTMLMediaElement.prototype.play to throw an error
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValue(new Error("autoplay blocked"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    renderAt("/practice/speaking/read-aloud/12");

    await waitFor(() => expect(screen.getByText("Autoplay error test text.")).toBeInTheDocument());

    // Because play rejected, it should catch error and transition to rec-countdown
    await waitFor(() => expect(screen.getByText("Preparation Time...")).toBeInTheDocument());

    playSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});

describe("QuestionPage - Writing Retry and Timer", () => {
  it("handles essay retry and rewrite", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          instruction: "Write Essay",
          question: {
            QUESTIONID: 13,
            QUESTION_TEXT: "Essay topic prompt text.",
            CATEGORY: "Writing",
            SUB_CATEGORY: "Write Essay",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ QUESTIONID: 13 }],
      });

    renderAt("/practice/writing/essay/13");

    await waitFor(() => expect(screen.getByText("Essay topic prompt text.")).toBeInTheDocument());

    const textarea = screen.getByPlaceholderText("Type your answer here...");
    fireEvent.change(textarea, { target: { value: "My essay response goes here." } });

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));

    await waitFor(() => expect(screen.getByText("Submission Review")).toBeInTheDocument());

    // Click Retry / Re-write
    fireEvent.click(screen.getByRole("button", { name: /Retry \/ Re-write/i }));

    // Check it's reset
    expect(screen.queryByText("Submission Review")).not.toBeInTheDocument();
    expect(textarea).toHaveValue("");
  });

  it("auto-submits writing question when time limit expires", async () => {
    vi.useFakeTimers();

    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          instruction: "Write Essay",
          question: {
            QUESTIONID: 14,
            QUESTION_TEXT: "Essay topic auto submit.",
            CATEGORY: "Writing",
            SUB_CATEGORY: "Write Essay",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ QUESTIONID: 14 }],
      });

    renderAt("/practice/writing/essay/14");

    // Flush mock fetch promises and render updates
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByText("Essay topic auto submit.")).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText("Type your answer here...");
    fireEvent.change(textarea, { target: { value: "My auto submit essay response." } });

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    // Fast-forward 20 minutes (1200 seconds)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200000);
    });

    expect(screen.getByText("Submission Review")).toBeInTheDocument();
    expect(screen.getByText(/This response was auto-submitted/i)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("handles non-JSON string options gracefully", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          instruction: "Choose one",
          question: {
            QUESTIONID: 16,
            QUESTION_TEXT: "Select a fruit.",
            CATEGORY: "Reading",
            SUB_CATEGORY: "Multiple Choice Single Answer",
            OPTIONS: "Apple, Banana, Orange",
            CORRECT_ANSWER: "Apple",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ QUESTIONID: 16 }],
      });

    renderAt("/practice/reading/single-answer/16");

    await waitFor(() => expect(screen.getByText("Apple")).toBeInTheDocument());
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.getByText("Orange")).toBeInTheDocument();
  });

  it("interacts and submits Dictation question", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          instruction: "Listen and type",
          question: {
            QUESTIONID: 15,
            QUESTION_TEXT: "Listen carefully to the sentence.",
            CATEGORY: "Listening",
            SUB_CATEGORY: "Write from Dictation",
            CORRECT_ANSWER: "This is a dictated sentence",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ QUESTIONID: 15 }],
      });

    renderAt("/practice/listening/dictation/15");

    await waitFor(() => expect(screen.getByText("Listen and type")).toBeInTheDocument());

    const textarea = screen.getByPlaceholderText("Type your answer here...");
    fireEvent.change(textarea, { target: { value: "This is a dictated sentence" } });
    expect(textarea).toHaveValue("This is a dictated sentence");

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        score: 90,
        accuracy: 100,
        feedback: "Perfect match",
      }),
    });

    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));

    await waitFor(() => expect(screen.getByText("Evaluation Summary")).toBeInTheDocument());
    expect(screen.getByText(/Perfect match/)).toBeInTheDocument();
  });

  it("handles Summarize Written Text retry and rewrite", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          instruction: "Summarize this",
          question: {
            QUESTIONID: 17,
            QUESTION_TEXT: "Some text to summarize.",
            CATEGORY: "Writing",
            SUB_CATEGORY: "Summarize Written Text",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ QUESTIONID: 17 }],
      });

    renderAt("/practice/writing/summarize/17");

    await waitFor(() => expect(screen.getByText("Some text to summarize.")).toBeInTheDocument());

    const textarea = screen.getByPlaceholderText("Type your answer here...");
    fireEvent.change(textarea, { target: { value: "A short summary sentence." } });

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));

    await waitFor(() => expect(screen.getByText("Submission Review")).toBeInTheDocument());

    // Click Retry / Re-write
    fireEvent.click(screen.getByRole("button", { name: /Retry \/ Re-write/i }));

    // Check it's reset
    expect(screen.queryByText("Submission Review")).not.toBeInTheDocument();
    expect(textarea).toHaveValue("");
  });
});
