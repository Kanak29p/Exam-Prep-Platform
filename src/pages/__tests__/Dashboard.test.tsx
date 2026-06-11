import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { name: "Tester", role: "student" } }),
}));

vi.mock("recharts", () => {
  const Stub = ({ children }: any) => <div>{children}</div>;
  return {
    LineChart: Stub,
    Line: () => null,
    BarChart: Stub,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    ResponsiveContainer: Stub,
    RadarChart: Stub,
    PolarGrid: () => null,
    PolarAngleAxis: () => null,
    PolarRadiusAxis: () => null,
    Radar: () => null,
  };
});

import { Dashboard } from "../Dashboard";

function renderDash() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.setItem("token", "tok");
  vi.stubGlobal("fetch", vi.fn());
});

describe("Dashboard", () => {
  it("shows loading skeleton initially", () => {
    (globalThis.fetch as any).mockImplementation(() => new Promise(() => undefined));
    const { container } = renderDash();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders welcome header with user name and stats after fetch resolves", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        overallScore: 75,
        targetScore: 85,
        pointsImproved: 10,
        mockTestsCompleted: 3,
        practiceTime: "5h",
      }),
    });
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { STATUS: "active", name: "T1" },
        { STATUS: "upcoming", name: "T2" },
      ],
    });

    renderDash();

    await waitFor(() =>
      expect(screen.getByText(/Welcome back, Tester/)).toBeInTheDocument(),
    );
    expect(screen.getByText("75/90")).toBeInTheDocument();
    expect(screen.getByText(/Current PTE Score/)).toBeInTheDocument();
  });

  it("clears localStorage and reloads on 401", async () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    });

    (globalThis.fetch as any).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    renderDash();
    await waitFor(() => expect(reloadSpy).toHaveBeenCalled());
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("renders error state when fetch rejects, and allows retry", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    (globalThis.fetch as any).mockRejectedValueOnce(new Error("network down"));

    renderDash();

    // Verify error UI is shown
    await waitFor(() =>
      expect(screen.getByText("Something went wrong")).toBeInTheDocument(),
    );
    expect(screen.getByText("network down")).toBeInTheDocument();

    const { fireEvent } = await import("@testing-library/react");
    // Verify retry button click refetches successfully
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ overallScore: 75 }),
    });
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    const retryBtn = screen.getByRole("button", { name: /retry loading/i });
    fireEvent.click(retryBtn);

    await waitFor(() =>
      expect(screen.getByText(/Welcome back, Tester/)).toBeInTheDocument(),
    );

    errorSpy.mockRestore();
  });

  it("renders empty statistics states when data arrays are empty", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        overallScore: 0,
        scoreProgress: [],
        modulePerformance: [],
        skillRadar: [],
      }),
    });
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    renderDash();

    await waitFor(() =>
      expect(screen.getByText(/No progress data available yet/)).toBeInTheDocument(),
    );
    expect(screen.getByText(/No module performance data available yet/)).toBeInTheDocument();
    expect(screen.getByText(/No skill analysis available yet/)).toBeInTheDocument();
  });
});
