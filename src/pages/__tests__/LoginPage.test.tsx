import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

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
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { LoginPage } from "../LoginPage";

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe("LoginPage - email/password validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the login form", () => {
    renderLogin();
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
  });

  it("shows the signup link with correct href", () => {
    renderLogin();
    const signupLink = screen.getByRole("link", { name: /sign up/i });
    expect(signupLink).toHaveAttribute("href", "/signup");
  });

  it("disables submit button while loading", async () => {
    mockLogin.mockImplementation(() => new Promise(() => undefined));
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^login$/i }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /logging in/i }),
      ).toBeInTheDocument(),
    );
  });

  it("calls login with email and password on submit", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    localStorage.setItem("user", JSON.stringify({ role: "student" }));

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "student@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "pass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith("student@test.com", "pass123"),
    );
  });

  it("navigates to /dashboard for student role on success", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    localStorage.setItem("user", JSON.stringify({ role: "student" }));

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "s@t.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "pwd" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard"));
  });

  it("navigates to /admin for admin role on success", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    localStorage.setItem("user", JSON.stringify({ role: "admin" }));

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "a@t.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "pwd" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/admin"));
  });

  it("shows error toast on failed login", async () => {
    const { toast } = await import("sonner");
    mockLogin.mockRejectedValueOnce(new Error("Wrong password"));

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "x@x.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "bad" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Wrong password"));
  });

  it("shows generic error message when login error has no message", async () => {
    const { toast } = await import("sonner");
    mockLogin.mockRejectedValueOnce({});

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "x@x.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "bad" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Login failed"));
  });

  it("shows error toast when credentials are invalid", async () => {
    const { toast } = await import("sonner");
    mockLogin.mockRejectedValueOnce(new Error("Invalid email or password"));

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "wrong@wrong.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Invalid email or password"),
    );
  });

  it("shows error toast when request times out", async () => {
    const { toast } = await import("sonner");
    mockLogin.mockRejectedValueOnce(new Error("Network request timed out. Please try again."));

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "timeout@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "pass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Network request timed out. Please try again."),
    );
  });
});

describe("LoginPage - password visibility toggle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("toggles password visibility when eye icon is clicked", () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    expect(passwordInput.getAttribute("type")).toBe("password");

    const toggleButtons = screen.getAllByRole("button");
    const eyeButton = toggleButtons.find(
      (b) => b.getAttribute("type") === "button" && !b.textContent,
    );
    expect(eyeButton).toBeDefined();

    fireEvent.click(eyeButton!);
    expect(passwordInput.getAttribute("type")).toBe("text");
    fireEvent.click(eyeButton!);
    expect(passwordInput.getAttribute("type")).toBe("password");
  });
});

describe("LoginPage - Forgot Password flow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("switches to forgot password view on clicking 'Forgot password?'", () => {
    renderLogin();
    fireEvent.click(screen.getByText("Forgot password?"));
    expect(screen.getByText("Reset Password")).toBeInTheDocument();
  });

  it("pre-fills the forgot email with the entered login email", () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "filled@test.com" },
    });
    fireEvent.click(screen.getByText("Forgot password?"));

    const forgotInput = screen.getByPlaceholderText(
      "you@example.com",
    ) as HTMLInputElement;
    expect(forgotInput.value).toBe("filled@test.com");
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
      expect(mockSendPasswordReset).toHaveBeenCalledWith("forgot@test.com"),
    );
  });

  it("shows error toast when password reset fails", async () => {
    const { toast } = await import("sonner");
    mockSendPasswordReset.mockRejectedValueOnce(new Error("user not found"));

    renderLogin();
    fireEvent.click(screen.getByText("Forgot password?"));
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "ghost@test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("user not found"),
    );
  });

  it("shows loading text while reset is pending", async () => {
    mockSendPasswordReset.mockImplementation(
      () => new Promise(() => undefined),
    );
    renderLogin();
    fireEvent.click(screen.getByText("Forgot password?"));
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "wait@t.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /sending link/i }),
      ).toBeInTheDocument(),
    );
  });

  it("goes back to login when 'Back to Login' is clicked", () => {
    renderLogin();
    fireEvent.click(screen.getByText("Forgot password?"));
    fireEvent.click(screen.getByText("Back to Login"));
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
  });
});

describe("LoginPage - Google Login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls googleLogin and navigates to /dashboard for student", async () => {
    mockGoogleLogin.mockResolvedValueOnce(undefined);
    localStorage.setItem("user", JSON.stringify({ role: "student" }));
    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: /google/i }));
    await waitFor(() => expect(mockGoogleLogin).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard"));
  });

  it("navigates to /admin when Google user has admin role", async () => {
    mockGoogleLogin.mockResolvedValueOnce(undefined);
    localStorage.setItem("user", JSON.stringify({ role: "admin" }));
    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: /google/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/admin"));
  });

  it("shows error toast when Google login fails", async () => {
    const { toast } = await import("sonner");
    mockGoogleLogin.mockRejectedValueOnce(new Error("popup blocked"));
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: /google/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("popup blocked"),
    );
  });
});
