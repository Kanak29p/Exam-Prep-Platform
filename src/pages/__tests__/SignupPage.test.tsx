import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockSignup = vi.fn();
const mockGoogleSignup = vi.fn();
const mockSetUser = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    signup: mockSignup,
    googleSignup: mockGoogleSignup,
    setUser: mockSetUser,
    loading: false,
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

const hoisted = vi.hoisted(() => {
  return {
    linkWithCredentialMock: vi.fn(),
    emailAuthCredentialMock: vi.fn(() => ({ providerId: "password" })),
    mockAuth: { currentUser: null as any },
  };
});

const { linkWithCredentialMock, emailAuthCredentialMock, mockAuth } = hoisted;

vi.mock("firebase/auth", () => ({
  EmailAuthProvider: {
    credential: (...a: any[]) => hoisted.emailAuthCredentialMock(...a),
  },
  linkWithCredential: (...a: any[]) => hoisted.linkWithCredentialMock(...a),
}));

vi.mock("../../lib/firebase", () => ({
  auth: hoisted.mockAuth,
  provider: {},
  messaging: null,
}));

import { SignupPage } from "../SignupPage";

function renderSignup() {
  return render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>,
  );
}

function fillSignupForm(opts: {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}) {
  const {
    name = "Jane",
    email = "jane@test.com",
    password = "longpass1",
    confirm = password,
  } = opts;

  fireEvent.change(screen.getByPlaceholderText("John Doe"), {
    target: { value: name },
  });
  fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), {
    target: { value: password },
  });
  fireEvent.change(screen.getByPlaceholderText("Confirm your password"), {
    target: { value: confirm },
  });
  const checkbox = screen
    .getAllByRole("checkbox")
    .find((c) => c.hasAttribute("required"));
  if (checkbox) fireEvent.click(checkbox);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.currentUser = null;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) }),
  );
});

describe("SignupPage - validation", () => {
  it("renders the signup form", () => {
    renderSignup();
    expect(
      screen.getByRole("heading", { name: "Create Account" }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Min. 8 characters")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Confirm your password"),
    ).toBeInTheDocument();
  });

  it("toasts when passwords do not match", async () => {
    const { toast } = await import("sonner");
    renderSignup();
    fillSignupForm({ password: "abcdefgh", confirm: "different" });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Passwords do not match"),
    );
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it("toasts when password is shorter than 8 chars", async () => {
    const { toast } = await import("sonner");
    renderSignup();
    fillSignupForm({ password: "short", confirm: "short" });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Password must be at least 8 characters",
      ),
    );
    expect(mockSignup).not.toHaveBeenCalled();
  });
});

describe("SignupPage - submission", () => {
  it("calls signup and shows verification screen on success", async () => {
    mockSignup.mockResolvedValueOnce(undefined);
    renderSignup();
    fillSignupForm({ name: "Jane", email: "jane@test.com" });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(mockSignup).toHaveBeenCalledWith("Jane", "jane@test.com", "longpass1"),
    );
    await waitFor(() =>
      expect(screen.getByText("Verify Your Email")).toBeInTheDocument(),
    );
    expect(screen.getByText("jane@test.com")).toBeInTheDocument();
  });

  it("shows error toast when signup fails", async () => {
    const { toast } = await import("sonner");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockSignup.mockRejectedValueOnce(new Error("Email already used"));
    renderSignup();
    fillSignupForm({});
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Email already used"),
    );
    errorSpy.mockRestore();
  });
});

describe("SignupPage - Google flow", () => {
  it("flips to 'Set Your Password' for new Google users", async () => {
    mockGoogleSignup.mockResolvedValueOnce({
      isNewUser: true,
      email: "g@x.com",
      googleUser: { uid: "g" },
      name: "Goog",
    });
    renderSignup();

    fireEvent.click(screen.getByRole("button", { name: /google/i }));

    await waitFor(() =>
      expect(screen.getByText("Set Your Password")).toBeInTheDocument(),
    );
  });

  it("redirects existing Google user to login", async () => {
    mockGoogleSignup.mockResolvedValueOnce({
      isNewUser: false,
      email: "g@x.com",
    });
    renderSignup();

    fireEvent.click(screen.getByRole("button", { name: /google/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/login"));
  });

  it("shows error toast when Google signup fails", async () => {
    const { toast } = await import("sonner");
    mockGoogleSignup.mockRejectedValueOnce(new Error("popup closed"));
    renderSignup();

    fireEvent.click(screen.getByRole("button", { name: /google/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Google signup failed"),
    );
  });

  it("links Google user with new password and navigates to dashboard", async () => {
    mockGoogleSignup.mockResolvedValueOnce({
      isNewUser: true,
      email: "g@x.com",
      googleUser: { uid: "g" },
      name: "Goog",
    });

    mockAuth.currentUser = {
      email: "g@x.com",
      reload: vi.fn().mockResolvedValue(undefined),
    };
    linkWithCredentialMock.mockResolvedValueOnce({
      user: {
        getIdToken: vi.fn().mockResolvedValue("token-xyz"),
      },
    });

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        token: "back-token",
        user: { id: "g", name: "Goog", email: "g@x.com", role: "student" },
      }),
    });

    const { toast } = await import("sonner");
    renderSignup();

    fireEvent.click(screen.getByRole("button", { name: /google/i }));
    await waitFor(() =>
      expect(screen.getByText("Set Your Password")).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText("Enter new password"), {
      target: { value: "longpass1" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm password"), {
      target: { value: "longpass1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save password/i }));

    await waitFor(() => expect(linkWithCredentialMock).toHaveBeenCalled());
    await waitFor(() => expect(localStorage.getItem("token")).toBe("back-token"));
    expect(mockSetUser).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    expect(toast.success).toHaveBeenCalledWith("Password set successfully!");
  });
});
