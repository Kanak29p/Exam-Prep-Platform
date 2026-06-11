import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { onMessage } from "firebase/messaging";

const mockAuthState: {
  user: any;
  isAuthenticated: boolean;
  loading: boolean;
} = { user: null, isAuthenticated: false, loading: false };

vi.mock("./contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useAuth: () => mockAuthState,
}));

const memoryEntries: { current: string[] } = { current: ["/"] };

vi.mock("react-router-dom", async () => {
  const actual: any = await vi.importActual("react-router-dom");
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => {
      return (
        <actual.MemoryRouter initialEntries={memoryEntries.current}>
          {children}
        </actual.MemoryRouter>
      );
    },
  };
});

vi.mock("./components/organisms/Navbar", () => ({
  Navbar: () => <nav data-testid="navbar">NAV</nav>,
}));
vi.mock("./components/organisms/ChatSupport", () => ({
  ChatSupport: () => <div data-testid="chat-support">CHAT</div>,
}));
vi.mock("./pages/HomePage", () => ({
  HomePage: () => <div>HOME</div>,
}));
vi.mock("./pages/LoginPage", () => ({
  LoginPage: () => <div>LOGIN</div>,
}));
vi.mock("./pages/SignupPage", () => ({
  SignupPage: () => <div>SIGNUP</div>,
}));
vi.mock("./pages/Dashboard", () => ({
  Dashboard: () => <div>DASHBOARD</div>,
}));
vi.mock("./pages/PracticePage", () => ({
  PracticePage: () => <div>PRACTICE</div>,
}));
vi.mock("./pages/MockTestPage", () => ({
  MockTestPage: () => <div>MOCKTEST</div>,
}));
vi.mock("./pages/AdminPanel", () => ({
  AdminPanel: () => <div>ADMIN</div>,
}));
vi.mock("./pages/PricingPage", () => ({
  PricingPage: () => <div>PRICING</div>,
}));
vi.mock("./pages/LeaderboardPage", () => ({
  LeaderboardPage: () => <div>LEADERBOARD</div>,
}));
vi.mock("./pages/LiveClassesPage", () => ({
  LiveClassesPage: () => <div>LIVECLASSES</div>,
}));
vi.mock("./pages/ForumPage", () => ({
  ForumPage: () => <div>FORUM</div>,
}));
vi.mock("./pages/ProfilePage", () => ({
  ProfilePage: () => <div>PROFILE</div>,
}));
vi.mock("./pages/NotFoundPage", () => ({
  NotFoundPage: () => <div>NOTFOUND</div>,
}));
vi.mock("./pages/SectionQuestionsPage", () => ({
  SectionQuestionsPage: () => <div>SECTIONQUESTIONS</div>,
}));
vi.mock("./pages/QuestionPage", () => ({
  QuestionPage: () => <div>QUESTIONPAGE</div>,
}));

const mocks = vi.hoisted(() => {
  return {
    onMessageCallback: { current: null as any },
    mockMessaging: { current: null as any }
  };
});

vi.mock("./lib/firebase", () => ({
  auth: { currentUser: null },
  provider: {},
  get messaging() {
    return mocks.mockMessaging.current;
  }
}));

vi.mock("firebase/messaging", () => ({
  getToken: vi.fn().mockResolvedValue("mock-fcm-token"),
  onMessage: vi.fn((_m, cb) => {
    mocks.onMessageCallback.current = cb;
    return () => {
      mocks.onMessageCallback.current = null;
    };
  }),
}));

vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import App from "./App";

beforeEach(() => {
  mockAuthState.user = null;
  mockAuthState.isAuthenticated = false;
  mockAuthState.loading = false;
  memoryEntries.current = ["/"];
  mocks.mockMessaging.current = null;
});

describe("App routing - public routes", () => {
  it("renders HomePage at /", async () => {
    memoryEntries.current = ["/"];
    render(<App />);
    expect(await screen.findByText("HOME")).toBeInTheDocument();
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
  });

  it("renders LoginPage at /login and hides ChatSupport", async () => {
    memoryEntries.current = ["/login"];
    render(<App />);
    expect(await screen.findByText("LOGIN")).toBeInTheDocument();
    expect(screen.queryByTestId("chat-support")).not.toBeInTheDocument();
  });

  it("renders SignupPage at /signup and hides ChatSupport", async () => {
    memoryEntries.current = ["/signup"];
    render(<App />);
    expect(await screen.findByText("SIGNUP")).toBeInTheDocument();
    expect(screen.queryByTestId("chat-support")).not.toBeInTheDocument();
  });

  it("renders PricingPage at /pricing and shows ChatSupport", async () => {
    memoryEntries.current = ["/pricing"];
    render(<App />);
    expect(await screen.findByText("PRICING")).toBeInTheDocument();
    expect(screen.getByTestId("chat-support")).toBeInTheDocument();
  });

  it("renders LeaderboardPage at /leaderboard", async () => {
    memoryEntries.current = ["/leaderboard"];
    render(<App />);
    expect(await screen.findByText("LEADERBOARD")).toBeInTheDocument();
  });

  it("renders LiveClassesPage at /live-classes", async () => {
    memoryEntries.current = ["/live-classes"];
    render(<App />);
    expect(await screen.findByText("LIVECLASSES")).toBeInTheDocument();
  });

  it("renders ForumPage at /forum", async () => {
    memoryEntries.current = ["/forum"];
    render(<App />);
    expect(await screen.findByText("FORUM")).toBeInTheDocument();
  });

  it("renders NotFoundPage for unknown routes", async () => {
    memoryEntries.current = ["/totally-unknown"];
    render(<App />);
    expect(await screen.findByText("NOTFOUND")).toBeInTheDocument();
  });
});

describe("App routing - ProtectedRoute", () => {
  it("redirects to /login when unauthenticated", async () => {
    mockAuthState.isAuthenticated = false;
    memoryEntries.current = ["/dashboard"];
    render(<App />);
    expect(await screen.findByText("LOGIN")).toBeInTheDocument();
  });

  it("renders Dashboard when authenticated", async () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: "u", role: "student" };
    memoryEntries.current = ["/dashboard"];
    render(<App />);
    expect(await screen.findByText("DASHBOARD")).toBeInTheDocument();
  });

  it("shows AuthLoading when loading", async () => {
    mockAuthState.loading = true;
    memoryEntries.current = ["/dashboard"];
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText(/Loading/i)).toBeInTheDocument(),
    );
  });

  it("guards /practice route", async () => {
    mockAuthState.isAuthenticated = false;
    memoryEntries.current = ["/practice"];
    render(<App />);
    expect(await screen.findByText("LOGIN")).toBeInTheDocument();
  });

  it("renders Practice route when authenticated", async () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: "u", role: "student" };
    memoryEntries.current = ["/practice"];
    render(<App />);
    expect(await screen.findByText("PRACTICE")).toBeInTheDocument();
  });
});

describe("App routing - AdminRoute", () => {
  it("redirects non-admins to /dashboard", async () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: "u", role: "student" };
    memoryEntries.current = ["/admin"];
    render(<App />);
    expect(await screen.findByText("DASHBOARD")).toBeInTheDocument();
  });

  it("renders AdminPanel for admin role", async () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: "u", role: "admin" };
    memoryEntries.current = ["/admin"];
    render(<App />);
    expect(await screen.findByText("ADMIN")).toBeInTheDocument();
  });

  it("redirects unauthenticated to /dashboard then /login", async () => {
    mockAuthState.isAuthenticated = false;
    memoryEntries.current = ["/admin"];
    render(<App />);
    expect(await screen.findByText("LOGIN")).toBeInTheDocument();
  });
});

describe("App notifications and service worker registration", () => {
  let originalNotification: any;
  let requestPermissionMock: any;

  beforeEach(() => {
    originalNotification = (globalThis as any).Notification;
    requestPermissionMock = vi.fn().mockResolvedValue("granted");
    (globalThis as any).Notification = {
      requestPermission: requestPermissionMock,
    };
    localStorage.clear();
    mocks.onMessageCallback.current = null;
    mocks.mockMessaging.current = {};
    vi.mocked(onMessage).mockClear();
  });

  afterEach(() => {
    (globalThis as any).Notification = originalNotification;
    vi.restoreAllMocks();
  });

  it("registers FCM service worker and saves token on backend when authenticated", async () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: "u", role: "student" };
    localStorage.setItem("token", "dummy-jwt");

    render(<App />);

    await waitFor(() => {
      expect(requestPermissionMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mocks.onMessageCallback.current).not.toBeNull();
    });
  });

  it("handles foreground message payload when onMessage triggers", async () => {
    const { toast } = await import("sonner");
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: "u", role: "student" };

    render(<App />);

    await waitFor(() => {
      expect(mocks.onMessageCallback.current).not.toBeNull();
    });

    const mockPayload = {
      notification: {
        title: "New Update",
        body: "A new practice set is available.",
      },
      data: {
        url: "/practice/speaking",
      },
    };

    act(() => {
      mocks.onMessageCallback.current!({ ...mockPayload });
    });

    expect(toast.info).toHaveBeenCalledWith("New Update", expect.any(Object));
  });

  it("handles service worker registration failure by falling back to ready", async () => {
    const registerSpy = vi
      .spyOn(navigator.serviceWorker, "register")
      .mockRejectedValueOnce(new Error("failed registration"));
    
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: "u", role: "student" };
    render(<App />);

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalled();
    });
  });

  it("does not register service worker or save token if permission is denied", async () => {
    const registerSpy = vi.spyOn(navigator.serviceWorker, "register");
    requestPermissionMock.mockResolvedValueOnce("denied");
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: "u", role: "student" };
    render(<App />);

    await waitFor(() => {
      expect(requestPermissionMock).toHaveBeenCalled();
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("does not setup notifications if user is not authenticated", async () => {
    mockAuthState.isAuthenticated = false;
    render(<App />);
    expect(onMessage).not.toHaveBeenCalled();
  });

  it("does not setup notifications if messaging is null", async () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: "u", role: "student" };
    mocks.mockMessaging.current = null;
    render(<App />);
    expect(onMessage).not.toHaveBeenCalled();
  });
});

