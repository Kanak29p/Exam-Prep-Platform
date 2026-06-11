import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "../LoginPage";
import { MockTestPage } from "../MockTestPage";

// Mock Auth Context for Login integration flow
const mockLogin = vi.fn();
const mockGoogleLogin = vi.fn();
const mockSendPasswordReset = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    googleLogin: mockGoogleLogin,
    sendPasswordReset: mockSendPasswordReset,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../components/organisms/AudioRecorder", () => ({
  AudioRecorder: () => <div data-testid="audio-recorder" />,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe("Frontend E2E Integration Flow Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  // =====================================================================
  // 1. User Login Integration Flow
  // =====================================================================
  describe("User Login Flow", () => {
    it("renders Login Page, submits form, saves credentials, and redirects role", async () => {
      mockLogin.mockResolvedValueOnce(undefined);
      localStorage.setItem("user", JSON.stringify({ id: "u_1", role: "student", email: "student@test.com" }));

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      // Verify page inputs render
      expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();

      // Enter details
      fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
        target: { value: "student@test.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "pass123" },
      });

      // Click submit
      fireEvent.click(screen.getByRole("button", { name: /^login$/i }));

      // Verify auth handler and redirect
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("student@test.com", "pass123");
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      });
    });
  });

  // =====================================================================
  // 2. Mock Test E2E Integration Flow
  // =====================================================================
  describe("Mock Test E2E Flow", () => {
    const sampleTest = {
      ID: 1,
      TITLE: "PTE Mock Test 1",
      DESCRIPTION: "Full mock examination.",
      TOTAL_QUESTIONS: 2,
      TOTAL_DURATION_MINUTES: 120,
      STATUS: "active",
    };

    const mockStartResult = {
      id: "attempt-123",
      questions: [
        {
          ID: 101,
          TITLE: "Essay Prompt 1",
          CATEGORY: "Writing",
          SUB_CATEGORY: "Write Essay",
          QUESTION_TEXT: "Discuss the impact of technology on remote education.",
          INSTRUCTION: "Write a 200-300 word essay.",
          CORRECT_ANSWER: "",
        },
        {
          ID: 102,
          TITLE: "MCQ Reading 2",
          CATEGORY: "Reading",
          SUB_CATEGORY: "MCQ Single Answer",
          QUESTION_TEXT: "Select the primary source of solar energy.",
          INSTRUCTION: "Choose the correct option.",
          CORRECT_ANSWER: "Sun",
          OPTIONS: "Moon, Sun, Earth, Mars",
        },
      ],
    };

    beforeEach(() => {
      localStorage.setItem("token", "valid-user-token");
    });

    it("loads active mock test, starts it, answers questions, updates progress, and submits test successfully", async () => {
      // Mock API Endpoints sequence:
      // 1. GET mock-tests -> [sampleTest]
      // 2. GET attempts -> [] (no prior attempts)
      // 3. POST start attempt -> mockStartResult
      // 4. POST submit answer Q1 -> { score: 90, accuracy: 100, feedback: "Great discourse." }
      // 5. PUT progress update -> { message: "Saved" }
      // 6. POST submit answer Q2 -> { score: 90, accuracy: 100, feedback: "Correct." }
      // 7. PUT progress update -> { message: "Saved" }
      // 8. POST submit attempt -> { message: "Submitted" }
      // 9. GET attempts refresh -> [completed attempt] (we mock it as empty or completed to simplify)

      (globalThis.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [sampleTest],
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => mockStartResult,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({ score: 80, accuracy: 90, feedback: "Great discourse." }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ message: "Saved" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ message: "Saved" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({ score: 90, accuracy: 100, feedback: "Correct." }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ message: "Saved" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ message: "Submitted" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [],
        });

      render(
        <MemoryRouter>
          <MockTestPage />
        </MemoryRouter>
      );

      // 1. Verify mock test appears in list
      await waitFor(() => {
        expect(screen.getByText("PTE Mock Test 1")).toBeInTheDocument();
      });

      // 2. Click Start Test
      const startBtn = screen.getByRole("button", { name: /start test/i });
      fireEvent.click(startBtn);

      // 3. Confirm in modal
      await waitFor(() => {
        expect(screen.getByText("Start Examination")).toBeInTheDocument();
      });
      const confirmBtn = screen.getByRole("button", { name: "Start Now" });
      fireEvent.click(confirmBtn);

      // 4. Verify Question 1 (Essay) renders
      await waitFor(() => {
        expect(screen.getByText("Essay Prompt 1")).toBeInTheDocument();
        expect(screen.getByText("Discuss the impact of technology on remote education.")).toBeInTheDocument();
      });

      // 5. Input response to essay textarea
      const textInput = screen.getByPlaceholderText("Type your response here...");
      fireEvent.change(textInput, { target: { value: "Remote education has expanded rapidly due to digital technology." } });

      // Click Submit Answer
      const submitQ1Btn = screen.getByRole("button", { name: "Submit Answer" });
      fireEvent.click(submitQ1Btn);

      // Wait for submission confirmation
      await waitFor(() => {
        expect(screen.getByText("Answer Submitted")).toBeInTheDocument();
      });

      // 6. Navigate to Next Question
      const nextBtn = screen.getByRole("button", { name: /next question/i });
      fireEvent.click(nextBtn);

      // 7. Verify Question 2 (MCQ Reading) renders
      await waitFor(() => {
        expect(screen.getByText("MCQ Reading 2")).toBeInTheDocument();
        expect(screen.getByText("Select the primary source of solar energy.")).toBeInTheDocument();
      });

      // Select option "Sun"
      const sunOption = screen.getByText("Sun");
      fireEvent.click(sunOption);

      // Submit Q2
      const submitQ2Btn = screen.getByRole("button", { name: "Submit Answer" });
      fireEvent.click(submitQ2Btn);

      await waitFor(() => {
        expect(screen.getByText("Submitted!")).toBeInTheDocument();
      });

      // 8. Finish Exam (clicks Next Question / Finish Test)
      const finishBtn = screen.getByRole("button", { name: /finish test/i });
      fireEvent.click(finishBtn);

      // 9. Verify E2E results dashboard report
      await waitFor(() => {
        expect(screen.getByText("Exam Completed")).toBeInTheDocument();
        expect(screen.getByText("PTE Score")).toBeInTheDocument();
      });

      // Check average overall score calculated ( (80 + 90) / 2 = 85 )
      expect(screen.getByText("85")).toBeInTheDocument();

      // Return back to tests list
      const returnBtn = screen.getByRole("button", { name: "Return to Mock Tests" });
      fireEvent.click(returnBtn);

      await waitFor(() => {
        expect(screen.getByText("PTE Mock Test 1")).toBeInTheDocument();
      });
    });
  });
});
