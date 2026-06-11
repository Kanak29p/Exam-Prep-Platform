import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();
const mockLogout = vi.fn().mockResolvedValue(undefined);
const mockSetTheme = vi.fn();

let mockUser: any = null;
let mockIsAuthenticated = false;
let mockTheme = "light";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: mockTheme, setTheme: mockSetTheme }),
}));

import { Navbar } from "../Navbar";

function renderNav() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockNavigate.mockClear();
  mockLogout.mockClear();
  mockSetTheme.mockClear();
  mockUser = null;
  mockIsAuthenticated = false;
  mockTheme = "light";
});

describe("Navbar", () => {
  it("renders public links when unauthenticated", () => {
    renderNav();
    expect(screen.getAllByRole("link", { name: "Home" }).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByRole("link", { name: "Pricing" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Login" }).length).toBe(1);
    expect(screen.getAllByRole("link", { name: "Sign Up" }).length).toBe(1);
  });

  it("renders student links when role is student", () => {
    mockIsAuthenticated = true;
    mockUser = { name: "Stu", email: "s@test.com", role: "student" };
    renderNav();
    expect(
      screen.getAllByRole("link", { name: "Dashboard" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "Practice" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Tests" }).length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByRole("link", { name: /admin panel/i })).toBeNull();
  });

  it("renders Admin Panel link for admin role", () => {
    mockIsAuthenticated = true;
    mockUser = { name: "Adm", email: "a@test.com", role: "admin" };
    renderNav();
    expect(
      screen.getAllByRole("link", { name: /admin panel/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull();
  });

  it("toggles theme when theme button is clicked", () => {
    renderNav();
    const buttons = screen.getAllByRole("button");
    const themeBtn = buttons.find((b) => b.querySelector("svg.lucide-moon"))!;
    fireEvent.click(themeBtn);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("calls logout and navigates to /login on Logout click", async () => {
    mockIsAuthenticated = true;
    mockUser = { name: "Stu", email: "s@test.com", role: "student" };
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: /logout/i }));
    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("opens mobile menu when burger is clicked", () => {
    const { container } = renderNav();
    const burger = container.querySelector(".md\\:hidden")!;
    fireEvent.click(burger);
    const links = screen.getAllByRole("link", { name: "Home" });
    expect(links.length).toBeGreaterThan(1);
  });

  it("renders authenticated student mobile menu items and clicks links", () => {
    mockIsAuthenticated = true;
    mockUser = { name: "Stu", email: "s@test.com", role: "student" };
    const { container } = renderNav();
    
    const burger = container.querySelector(".md\\:hidden")!;
    fireEvent.click(burger);

    const dashboardLinks = screen.getAllByRole("link", { name: "Dashboard" });
    expect(dashboardLinks.length).toBeGreaterThan(0);

    const practiceLink = screen.getAllByRole("link", { name: "Practice" })[1];
    fireEvent.click(practiceLink);
  });

  it("clicks all mobile menu links for unauthenticated user", () => {
    const { container } = renderNav();
    const burger = container.querySelector(".md\\:hidden")!;
    
    fireEvent.click(burger);
    const homeMobile = screen.getAllByRole("link", { name: "Home" })[1];
    expect(homeMobile).toBeInTheDocument();
    fireEvent.click(homeMobile);

    fireEvent.click(burger);
    const pricingMobile = screen.getAllByRole("link", { name: "Pricing" })[1];
    expect(pricingMobile).toBeInTheDocument();
    fireEvent.click(pricingMobile);

    fireEvent.click(burger);
    const leaderboardMobile = screen.getAllByRole("link", { name: "Leaderboard" })[1];
    expect(leaderboardMobile).toBeInTheDocument();
    fireEvent.click(leaderboardMobile);

    fireEvent.click(burger);
    const classesMobile = screen.getAllByRole("link", { name: "Classes" })[1];
    expect(classesMobile).toBeInTheDocument();
    fireEvent.click(classesMobile);

    fireEvent.click(burger);
    const loginMobile = screen.getAllByRole("link", { name: "Login" })[1];
    expect(loginMobile).toBeInTheDocument();
    fireEvent.click(loginMobile);

    fireEvent.click(burger);
    const signupMobile = screen.getAllByRole("link", { name: "Sign Up" })[1];
    expect(signupMobile).toBeInTheDocument();
    fireEvent.click(signupMobile);
  });

  it("clicks all mobile menu links for authenticated student", () => {
    mockIsAuthenticated = true;
    mockUser = { name: "Stu", email: "s@test.com", role: "student" };
    const { container } = renderNav();
    const burger = container.querySelector(".md\\:hidden")!;

    fireEvent.click(burger);
    const dashboardMobile = screen.getAllByRole("link", { name: "Dashboard" })[1];
    expect(dashboardMobile).toBeInTheDocument();
    fireEvent.click(dashboardMobile);

    fireEvent.click(burger);
    const practiceMobile = screen.getAllByRole("link", { name: "Practice" })[1];
    expect(practiceMobile).toBeInTheDocument();
    fireEvent.click(practiceMobile);

    fireEvent.click(burger);
    const testsMobile = screen.getAllByRole("link", { name: "Tests" })[1];
    expect(testsMobile).toBeInTheDocument();
    fireEvent.click(testsMobile);

    fireEvent.click(burger);
    const forumMobile = screen.getAllByRole("link", { name: "Forum" })[1];
    expect(forumMobile).toBeInTheDocument();
    fireEvent.click(forumMobile);

    fireEvent.click(burger);
    const profileMobile = screen.getAllByRole("link", { name: "Profile" })[1];
    expect(profileMobile).toBeInTheDocument();
    fireEvent.click(profileMobile);
  });

  it("clicks admin mobile menu links", () => {
    mockIsAuthenticated = true;
    mockUser = { name: "Adm", email: "a@test.com", role: "admin" };
    const { container } = renderNav();
    const burger = container.querySelector(".md\\:hidden")!;

    fireEvent.click(burger);
    const adminMobile = screen.getAllByRole("link", { name: /admin panel/i })[1];
    expect(adminMobile).toBeInTheDocument();
    fireEvent.click(adminMobile);
  });

  it("allows logging out from the mobile menu", async () => {
    mockIsAuthenticated = true;
    mockUser = { name: "Stu", email: "s@test.com", role: "student" };
    const { container } = renderNav();

    const burger = container.querySelector(".md\\:hidden")!;
    fireEvent.click(burger);

    const logoutButtons = screen.getAllByRole("button", { name: /logout/i });
    fireEvent.click(logoutButtons[1] || logoutButtons[0]);

    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("handles desktop profile dropdown interaction", () => {
    mockIsAuthenticated = true;
    mockUser = { name: "Stu", email: "s@test.com", role: "student" };
    renderNav();

    const profileLink = screen.getByRole("link", { name: "Profile" });
    expect(profileLink).toBeInTheDocument();
    fireEvent.click(profileLink);
  });
});

