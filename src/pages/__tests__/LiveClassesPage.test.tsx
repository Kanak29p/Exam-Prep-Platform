import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { LiveClassesPage } from "../LiveClassesPage";

describe("LiveClassesPage", () => {
  it("renders title and stats", () => {
    render(<LiveClassesPage />);
    expect(
      screen.getByRole("heading", { name: "Live Classes" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Classes This Month/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Recorded Classes/i).length).toBeGreaterThan(0);
  });

  it("shows upcoming classes by default", () => {
    render(<LiveClassesPage />);
    expect(
      screen.getByText("PTE Speaking Masterclass"),
    ).toBeInTheDocument();
    expect(screen.getByText("Writing Techniques & Tips")).toBeInTheDocument();
  });

  it("switches to recorded classes when tab is clicked", () => {
    render(<LiveClassesPage />);
    fireEvent.click(screen.getByRole("button", { name: /Recorded Classes/i }));
    expect(
      screen.getByText("Complete PTE Reading Strategy"),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Watch Now/i).length).toBeGreaterThan(0);
  });

  it("toasts on Register Now", async () => {
    const { toast } = await import("sonner");
    render(<LiveClassesPage />);
    fireEvent.click(screen.getAllByText(/Register Now/i)[0]);
    expect(toast.success).toHaveBeenCalledWith(
      "Successfully registered for the class!",
    );
  });

  it("toasts on Watch Now", async () => {
    const { toast } = await import("sonner");
    render(<LiveClassesPage />);
    fireEvent.click(screen.getByRole("button", { name: /Recorded Classes/i }));
    fireEvent.click(screen.getAllByText(/Watch Now/i)[0]);
    expect(toast.success).toHaveBeenCalledWith(
      "Joining class... Opening video conference",
    );
  });
});
