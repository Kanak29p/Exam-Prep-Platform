import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { HomePage } from "../HomePage";

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  it("renders the hero headline and subtitle", () => {
    renderHome();
    expect(
      screen.getByText(/Master PTE with AI-Powered Learning/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Get your desired PTE score/i),
    ).toBeInTheDocument();
  });

  it("renders Start Free Trial CTA linking to /signup", () => {
    renderHome();
    const start = screen.getByRole("link", { name: /Start Free Trial/i });
    expect(start).toHaveAttribute("href", "/signup");
  });

  it("renders See Pricing link", () => {
    renderHome();
    expect(
      screen.getByRole("link", { name: /See Pricing/i }),
    ).toHaveAttribute("href", "/pricing");
  });

  it("renders the stats grid", () => {
    renderHome();
    expect(screen.getByText("50,000+")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("4.9/5")).toBeInTheDocument();
  });

  it("renders feature cards", () => {
    renderHome();
    expect(screen.getByText("AI Speaking Evaluation")).toBeInTheDocument();
    expect(screen.getByText("Smart Writing Feedback")).toBeInTheDocument();
    expect(screen.getByText("Comprehensive Practice")).toBeInTheDocument();
    expect(screen.getByText("Realistic Mock Tests")).toBeInTheDocument();
  });

  it("renders pricing tiers and Get Started buttons that link to /signup", () => {
    renderHome();
    expect(screen.getByRole("heading", { name: "Basic" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Premium" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pro" })).toBeInTheDocument();
    const ctas = screen.getAllByRole("link", { name: /Get Started/i });
    ctas.forEach((cta) => expect(cta).toHaveAttribute("href", "/signup"));
  });

  it("renders the testimonials section", () => {
    renderHome();
    expect(screen.getByText(/Student Success Stories/i)).toBeInTheDocument();
    expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
  });

  it("renders the final CTA linking to /signup", () => {
    renderHome();
    const ctas = screen.getAllByRole("link", { name: /Start Your Free Trial/i });
    expect(ctas[0]).toHaveAttribute("href", "/signup");
  });
});
