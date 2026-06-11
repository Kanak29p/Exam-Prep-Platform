import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { PracticePage } from "../PracticePage";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/practice/:module" element={<PracticePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

const sectionsApi = [
  { CATEGORY: "Speaking", SUB_CATEGORY: "Read Aloud" },
  { CATEGORY: "Speaking", SUB_CATEGORY: "Repeat Sentence" },
  { CATEGORY: "Writing", SUB_CATEGORY: "Essay" },
  { CATEGORY: "Reading", SUB_CATEGORY: "Multiple Choice" },
];

beforeEach(() => {
  localStorage.setItem("token", "tok");
  vi.stubGlobal("fetch", vi.fn());
});

describe("PracticePage", () => {
  it("renders modules grouped by category after fetch", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sectionsApi,
    });

    renderAt("/practice");

    await waitFor(() =>
      expect(screen.getByText("Practice Modules")).toBeInTheDocument(),
    );
    expect(screen.getByText("Speaking")).toBeInTheDocument();
    expect(screen.getByText("Read Aloud")).toBeInTheDocument();
    expect(screen.getByText("Reading")).toBeInTheDocument();
  });

  it("normalizes 'Essay' to 'Write Essay' under Writing", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sectionsApi,
    });

    renderAt("/practice");
    await waitFor(() =>
      expect(screen.getByText("Write Essay")).toBeInTheDocument(),
    );
  });

  it("filters to a single module when /practice/:module is used", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sectionsApi,
    });

    renderAt("/practice/speaking");
    await waitFor(() =>
      expect(screen.getByText("speaking Practice")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Reading")).not.toBeInTheDocument();
    expect(screen.getByText("Read Aloud")).toBeInTheDocument();
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

    renderAt("/practice");
    await waitFor(() => expect(reloadSpy).toHaveBeenCalled());
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("renders breadcrumb link to /practice when on a module subpath", async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => sectionsApi,
    });

    renderAt("/practice/reading");
    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: /Practice Modules/i }),
      ).toBeInTheDocument(),
    );
  });
});
