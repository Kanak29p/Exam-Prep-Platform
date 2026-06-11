import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { LeaderboardPage } from "../LeaderboardPage";

describe("LeaderboardPage", () => {
  it("renders the heading and stats", () => {
    render(<LeaderboardPage />);
    expect(screen.getByText("Global Leaderboard")).toBeInTheDocument();
    expect(screen.getByText("Top 10%")).toBeInTheDocument();
    expect(screen.getByText("82/90")).toBeInTheDocument();
  });

  it("renders the rankings table with student names", () => {
    render(<LeaderboardPage />);
    expect(screen.getAllByText(/Rahul Verma/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Priya Sharma/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/David Chen/).length).toBeGreaterThan(0);
  });

  it("highlights time filter when a button is clicked", () => {
    render(<LeaderboardPage />);
    const allTime = screen.getByRole("button", { name: /all time/i });
    fireEvent.click(allTime);
    expect(allTime.className).toMatch(/text-white/);
  });

  it("renders Gold/Silver/Bronze podium labels", () => {
    render(<LeaderboardPage />);
    expect(screen.getByText("Gold")).toBeInTheDocument();
    expect(screen.getByText("Silver")).toBeInTheDocument();
    expect(screen.getByText("Bronze")).toBeInTheDocument();
  });
});
