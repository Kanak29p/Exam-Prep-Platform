import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { PricingPage } from "../PricingPage";

function renderPricing() {
  return render(
    <MemoryRouter>
      <PricingPage />
    </MemoryRouter>,
  );
}

describe("PricingPage", () => {
  it("renders headline and subheading", () => {
    renderPricing();
    expect(
      screen.getAllByText("Choose Your Plan").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders all four plan tiers", () => {
    renderPricing();
    expect(screen.getByRole("heading", { name: "Free" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Basic" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Premium" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pro" })).toBeInTheDocument();
  });

  it("marks Premium as most popular", () => {
    renderPricing();
    expect(screen.getAllByText("Most Popular").length).toBeGreaterThan(0);
  });

  it("renders Get Started CTAs that link to /signup", () => {
    renderPricing();
    const ctas = screen.getAllByRole("link", { name: /get started/i });
    expect(ctas.length).toBe(4);
    ctas.forEach((cta) => {
      expect(cta).toHaveAttribute("href", "/signup");
    });
  });

  it("renders the Feature Comparison table", () => {
    renderPricing();
    expect(screen.getByText("Feature Comparison")).toBeInTheDocument();
    expect(screen.getAllByText(/Mock Tests/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Live Classes/i).length).toBeGreaterThan(0);
  });

  it("renders the FAQ section with at least 4 questions", () => {
    renderPricing();
    expect(
      screen.getByText("Frequently Asked Questions"),
    ).toBeInTheDocument();
    expect(screen.getByText(/switch plans later/i)).toBeInTheDocument();
    expect(screen.getByText(/refund policy/i)).toBeInTheDocument();
  });
});
