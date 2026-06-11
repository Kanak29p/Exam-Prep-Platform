import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

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
  };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { AdminPanel } from "../AdminPanel";

function renderAdmin() {
  return render(
    <MemoryRouter>
      <AdminPanel />
    </MemoryRouter>,
  );
}

const sampleStudents = [
  {
    id: "u1",
    name: "Alice",
    email: "alice@test.com",
    plan: "Premium",
    score: 80,
    status: "Active",
    joined: "2026-01-01",
  },
  {
    id: "u2",
    name: "Bob",
    email: "bob@test.com",
    plan: "Free",
    score: 60,
    status: "Active",
    joined: "2026-02-02",
  },
];

beforeEach(() => {
  localStorage.setItem("token", "tok");
  vi.stubGlobal("fetch", vi.fn());
});

describe("AdminPanel", () => {
  it("renders header and stats", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleStudents,
    });

    renderAdmin();
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Total Students")).toBeInTheDocument();
    expect(screen.getByText("Monthly Revenue")).toBeInTheDocument();
  });

  it("switches tabs and shows Students table content", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleStudents,
    });

    renderAdmin();
    fireEvent.click(screen.getByRole("button", { name: /students/i }));

    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("filters students by search term", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleStudents,
    });

    renderAdmin();
    fireEvent.click(screen.getByRole("button", { name: /students/i }));
    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("Search students..."), {
      target: { value: "alice" },
    });

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
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

    renderAdmin();
    await waitFor(() => expect(reloadSpy).toHaveBeenCalled());
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("validates broadcast form requires title and body", async () => {
    const { toast } = await import("sonner");
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleStudents,
    });

    const { container } = renderAdmin();
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ count: 5 }),
    });
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

    await waitFor(() =>
      expect(screen.getByText(/subscribers/i)).toBeInTheDocument(),
    );

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Please fill in all required fields.",
      ),
    );
  });

  it("sends broadcast successfully when form is filled", async () => {
    const { toast } = await import("sonner");
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => sampleStudents,
    });

    const { container } = renderAdmin();
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ count: 3 }),
    });
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

    await waitFor(() =>
      expect(screen.getByText(/subscribers/i)).toBeInTheDocument(),
    );

    const titleInput = screen.getByPlaceholderText(/Special Live Masterclass/i);
    const bodyInput = screen.getByPlaceholderText(/Join us at/i);
    fireEvent.change(titleInput, { target: { value: "Hello" } });
    fireEvent.change(bodyInput, { target: { value: "Greetings everyone" } });

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Broadcast push notification sent successfully to all users!",
      ),
    );
  });

  describe("Question CRUD Management UI", () => {
    beforeEach(() => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => sampleStudents,
      });
    });

    it("renders questions bank tab with mock questions", async () => {
      renderAdmin();
      fireEvent.click(screen.getByRole("button", { name: /questions/i }));

      await waitFor(() =>
        expect(screen.getByText("Question Bank Management")).toBeInTheDocument()
      );
      expect(screen.getByText("Read Aloud - Practice 1")).toBeInTheDocument();
      expect(screen.getByText("Write Essay - Technology")).toBeInTheDocument();
    });

    it("displays validation error on empty fields submission", async () => {
      renderAdmin();
      fireEvent.click(screen.getByRole("button", { name: /questions/i }));

      await waitFor(() =>
        expect(screen.getByText("Add Question")).toBeInTheDocument()
      );
      fireEvent.click(screen.getByText("Add Question"));

      // Click save without filling fields
      fireEvent.click(screen.getByRole("button", { name: /save question/i }));

      await waitFor(() =>
        expect(screen.getByText("Title and Question Text are required fields.")).toBeInTheDocument()
      );
    });

    it("adds a question successfully and shows toast", async () => {
      const { toast } = await import("sonner");
      renderAdmin();
      fireEvent.click(screen.getByRole("button", { name: /questions/i }));

      await waitFor(() =>
        expect(screen.getByText("Add Question")).toBeInTheDocument()
      );
      fireEvent.click(screen.getByText("Add Question"));

      // Fill in fields
      fireEvent.change(screen.getByPlaceholderText("e.g. Read Aloud - Climate Change"), {
        target: { value: "New Reading Question" }
      });
      fireEvent.change(screen.getByPlaceholderText("Type question prompt text here..."), {
        target: { value: "This is a new test reading question." }
      });
      
      fireEvent.click(screen.getByRole("button", { name: /save question/i }));

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Question added successfully!")
      );
      expect(screen.getByText("New Reading Question")).toBeInTheDocument();
    });

    it("edits an existing question successfully", async () => {
      const { toast } = await import("sonner");
      renderAdmin();
      fireEvent.click(screen.getByRole("button", { name: /questions/i }));

      await waitFor(() =>
        expect(screen.getByText("Read Aloud - Practice 1")).toBeInTheDocument()
      );

      // Click edit icon for 'q1'
      fireEvent.click(screen.getByLabelText("edit-q1"));

      // Verify fields are pre-filled
      const titleInput = screen.getByPlaceholderText("e.g. Read Aloud - Climate Change") as HTMLInputElement;
      expect(titleInput.value).toBe("Read Aloud - Practice 1");

      // Modify the title
      fireEvent.change(titleInput, { target: { value: "Read Aloud - Practice 1 (Modified)" } });
      fireEvent.click(screen.getByRole("button", { name: /save question/i }));

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Question updated successfully!")
      );
      expect(screen.getByText("Read Aloud - Practice 1 (Modified)")).toBeInTheDocument();
    });

    it("deletes a question and can cancel deletion", async () => {
      const { toast } = await import("sonner");
      renderAdmin();
      fireEvent.click(screen.getByRole("button", { name: /questions/i }));

      await waitFor(() =>
        expect(screen.getByText("Write Essay - Technology")).toBeInTheDocument()
      );

      // Click delete icon for 'q2'
      fireEvent.click(screen.getByLabelText("delete-q2"));

      // Verify confirm delete modal is visible
      await waitFor(() =>
        expect(screen.getByText(/Are you sure you want to delete this question/i)).toBeInTheDocument()
      );

      // Click Cancel first
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      await waitFor(() =>
        expect(screen.getByText("Write Essay - Technology")).toBeInTheDocument()
      ); // still there

      // Click delete again and confirm
      fireEvent.click(screen.getByLabelText("delete-q2"));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /confirm delete/i })).toBeInTheDocument()
      );
      fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Question deleted successfully!")
      );
      await waitFor(() =>
        expect(screen.queryByText("Write Essay - Technology")).not.toBeInTheDocument()
      );
    });
  });
});
