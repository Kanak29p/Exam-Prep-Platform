import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "../../pages/LoginPage";

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────
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

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────
describe("LoginPage – email/password validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the login form", () => {
    renderLogin();
    expect(screen.getByText("Welcome Back")).toBeDefined();
    expect(screen.getByPlaceholderText("you@example.com")).toBeDefined();
    expect(screen.getByPlaceholderText("Enter your password")).toBeDefined();
  });

  it("disables submit button while loading", async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})); // never resolves
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /logging in/i })).toBeDefined()
    );
  });

  it("calls login() with email and password on submit", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    // Simulate localStorage user
    localStorage.setItem("user", JSON.stringify({ role: "student" }));

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "student@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "pass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith("student@test.com", "pass123"));
  });

  it("navigates to /dashboard for student role on success", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    localStorage.setItem("user", JSON.stringify({ role: "student" }));

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "s@t.com" } });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), { target: { value: "pwd" } });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard"));
  });

  it("navigates to /admin for admin role on success", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    localStorage.setItem("user", JSON.stringify({ role: "admin" }));

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@t.com" } });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), { target: { value: "pwd" } });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/admin"));
  });

  it("shows error toast on failed login", async () => {
    const { toast } = await import("sonner");
    mockLogin.mockRejectedValueOnce(new Error("Wrong password"));

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "x@x.com" } });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), { target: { value: "bad" } });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Wrong password"));
  });
});

describe("LoginPage – password visibility toggle", () => {
  it("toggles password visibility when eye icon is clicked", () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    expect(passwordInput.getAttribute("type")).toBe("password");

    // Find the toggle button (eye icon button)
    const toggleButtons = screen.getAllByRole("button");
    const eyeButton = toggleButtons.find((b) => b.getAttribute("type") === "button" && !b.textContent);
    if (eyeButton) {
      fireEvent.click(eyeButton);
      expect(passwordInput.getAttribute("type")).toBe("text");
      fireEvent.click(eyeButton);
      expect(passwordInput.getAttribute("type")).toBe("password");
    }
  });
});

describe("LoginPage – Forgot Password flow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("switches to forgot password view on clicking 'Forgot password?'", () => {
    renderLogin();
    fireEvent.click(screen.getByText("Forgot password?"));
    expect(screen.getByText("Reset Password")).toBeDefined();
  });

  it("calls sendPasswordReset with the entered email", async () => {
    mockSendPasswordReset.mockResolvedValueOnce(undefined);
    renderLogin();
    fireEvent.click(screen.getByText("Forgot password?"));

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "forgot@test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() =>
      expect(mockSendPasswordReset).toHaveBeenCalledWith("forgot@test.com")
    );
  });

  it("goes back to login when 'Back to Login' is clicked", () => {
    renderLogin();
    fireEvent.click(screen.getByText("Forgot password?"));
    fireEvent.click(screen.getByText("Back to Login"));
    expect(screen.getByText("Welcome Back")).toBeDefined();
  });
});

describe("LoginPage – Google Login", () => {
  it("calls googleLogin on Google button click", async () => {
    mockGoogleLogin.mockResolvedValueOnce(undefined);
    localStorage.setItem("user", JSON.stringify({ role: "student" }));
    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: /google/i }));
    await waitFor(() => expect(mockGoogleLogin).toHaveBeenCalled());
  });
});
