import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { SectionQuestionsPage } from "../SectionQuestionsPage";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/practice/:module/:section"
          element={<SectionQuestionsPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

const SAMPLE = Array.from({ length: 25 }, (_, i) => ({
  QUESTIONID: i + 1,
  QUESTION_TEXT: `Question text ${i + 1}`,
  TITLE: `Title ${i + 1}`,
}));

beforeEach(() => {
  localStorage.setItem("token", "tok");
  vi.stubGlobal("fetch", vi.fn());
});

describe("SectionQuestionsPage", () => {
  it("shows loading skeleton initially", () => {
    (globalThis.fetch as any).mockImplementation(() => new Promise(() => undefined));
    const { container } = renderAt("/practice/speaking/read-aloud");
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders the question list with correct count", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => SAMPLE.slice(0, 3),
    });

    renderAt("/practice/speaking/read-aloud");
    await waitFor(() =>
      expect(screen.getByText("3 questions")).toBeInTheDocument(),
    );
    expect(screen.getByText("Title 1")).toBeInTheDocument();
    expect(screen.getByText("Title 2")).toBeInTheDocument();
  });

  it("filters by search term", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { QUESTIONID: 10, QUESTION_TEXT: "Find apples", TITLE: "Apples Q" },
        { QUESTIONID: 11, QUESTION_TEXT: "Find oranges", TITLE: "Orange Q" },
      ],
    });

    renderAt("/practice/speaking/read-aloud");
    await waitFor(() =>
      expect(screen.getByText("Apples Q")).toBeInTheDocument(),
    );

    fireEvent.change(
      screen.getByPlaceholderText(/search by question text/i),
      { target: { value: "apples" } },
    );

    await waitFor(() =>
      expect(screen.queryByText("Orange Q")).not.toBeInTheDocument(),
    );
    expect(screen.getAllByText("Apples", { exact: false }).length).toBeGreaterThan(0);
  });

  it("shows empty state when API returns no questions", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    renderAt("/practice/speaking/read-aloud");
    await waitFor(() =>
      expect(screen.getByText("No questions yet")).toBeInTheDocument(),
    );
  });

  it("paginates correctly when more than pageSize", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => SAMPLE,
    });

    renderAt("/practice/speaking/read-aloud");
    await waitFor(() =>
      expect(screen.getByText("25 questions")).toBeInTheDocument(),
    );
    expect(screen.getByText(/Showing/)).toBeInTheDocument();

    expect(screen.getByText("Title 1")).toBeInTheDocument();
    expect(screen.queryByText("Title 11")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Next page"));
    await waitFor(() =>
      expect(screen.getByText("Title 11")).toBeInTheDocument(),
    );

    // Click "Last page"
    fireEvent.click(screen.getByLabelText("Last page"));
    await waitFor(() =>
      expect(screen.getByText("Title 21")).toBeInTheDocument(),
    );

    // Click page "2" button
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    await waitFor(() =>
      expect(screen.getByText("Title 11")).toBeInTheDocument(),
    );

    // Click "Previous page"
    fireEvent.click(screen.getByLabelText("Previous page"));
    await waitFor(() =>
      expect(screen.getByText("Title 1")).toBeInTheDocument(),
    );

    // Click "First page"
    fireEvent.click(screen.getByLabelText("First page"));
    await waitFor(() =>
      expect(screen.getByText("Title 1")).toBeInTheDocument(),
    );
  });

  it("clears localStorage and reloads on 401", async () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    });

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    renderAt("/practice/speaking/read-aloud");
    await waitFor(() => expect(reloadSpy).toHaveBeenCalled());
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("handles non-array API response gracefully", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ unexpected: "shape" }),
    });

    renderAt("/practice/speaking/read-aloud");
    await waitFor(() =>
      expect(screen.getByText("No questions yet")).toBeInTheDocument(),
    );
  });

  it("logs error and resets when fetch rejects", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    (globalThis.fetch as any).mockRejectedValueOnce(new Error("net"));

    renderAt("/practice/speaking/read-aloud");
    await waitFor(() =>
      expect(screen.getByText("No questions yet")).toBeInTheDocument(),
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
