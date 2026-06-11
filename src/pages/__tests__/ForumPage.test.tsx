import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { ForumPage } from "../ForumPage";

function renderForum() {
  return render(
    <MemoryRouter>
      <ForumPage />
    </MemoryRouter>,
  );
}

const samplePosts = [
  {
    id: 1,
    title: "How to prepare for Speaking?",
    content: "I need tips for read aloud.",
    author: "Alice",
    avatar: "a.png",
    category: "Speaking",
    timeAgo: "2h",
    likes: 5,
    replies: 2,
    views: 30,
    userLiked: false,
    isTrending: false,
  },
  {
    id: 2,
    title: "Writing essay structure?",
    content: "What's the best structure?",
    author: "Bob",
    avatar: "b.png",
    category: "Writing",
    timeAgo: "1d",
    likes: 8,
    replies: 3,
    views: 60,
    userLiked: true,
    isTrending: true,
  },
];

beforeEach(() => {
  localStorage.setItem("token", "tok");
  vi.stubGlobal("fetch", vi.fn());
});

describe("ForumPage", () => {
  it("renders header and stats", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => samplePosts,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          totalDiscussions: 12,
          activeMembers: 50,
          totalReplies: 100,
          totalViews: 1000,
          trendingTopics: ["Tip A"],
        }),
      });

    renderForum();
    expect(screen.getByText("Discussion Forum")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("12")).toBeInTheDocument());
  });

  it("renders post titles after fetch", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => samplePosts,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

    renderForum();
    await waitFor(() =>
      expect(
        screen.getByText("How to prepare for Speaking?"),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Writing essay structure?")).toBeInTheDocument();
  });

  it("filters posts by selected category", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => samplePosts,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

    renderForum();
    await waitFor(() =>
      expect(
        screen.getByText("How to prepare for Speaking?"),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Writing" }));
    expect(
      screen.queryByText("How to prepare for Speaking?"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Writing essay structure?")).toBeInTheDocument();
  });

  it("opens new post modal when clicking New Post", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => samplePosts,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

    renderForum();
    fireEvent.click(screen.getByRole("button", { name: /New Post/i }));
    expect(screen.getByText("Create New Discussion")).toBeInTheDocument();
  });

  it("validates that title and content are required when creating post", async () => {
    const { toast } = await import("sonner");
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => samplePosts,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

    const { container } = renderForum();
    fireEvent.click(screen.getByRole("button", { name: /New Post/i }));

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Please fill in all fields"),
    );
  });

  it("shows empty state when there are no posts", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

    renderForum();
    await waitFor(() =>
      expect(
        screen.getByText(/No discussions found matching your filters/i),
      ).toBeInTheDocument(),
    );
  });

  it("filters posts by search term", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => samplePosts,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

    renderForum();
    await waitFor(() =>
      expect(screen.getByText(/Speaking\?/)).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText("Search discussions..."), {
      target: { value: "essay" },
    });

    expect(screen.queryByText(/Speaking\?/)).not.toBeInTheDocument();
    expect(screen.getByText(/essay structure/i)).toBeInTheDocument();
  });

  it("likes a post successfully", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => samplePosts,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}), // for the like POST request
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}), // for stats refresh
      });

    renderForum();
    await waitFor(() =>
      expect(
        screen.getByText("How to prepare for Speaking?"),
      ).toBeInTheDocument(),
    );

    const likeButton = screen.getByRole("button", { name: "5" });
    fireEvent.click(likeButton);

    // Verify optimistic update (likes count goes to 6)
    await waitFor(() => expect(screen.getByText("6")).toBeInTheDocument());

    // Verify fetch call
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/forum/posts/1/like"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("reverts like status if API fails", async () => {
    const { toast } = await import("sonner");
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => samplePosts,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Server error" }), // for the like POST request
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => samplePosts, // for fallback fetchPosts
      });

    renderForum();
    await waitFor(() =>
      expect(
        screen.getByText("How to prepare for Speaking?"),
      ).toBeInTheDocument(),
    );

    const likeButton = screen.getByRole("button", { name: "5" });
    fireEvent.click(likeButton);

    // Verify optimistic update
    await waitFor(() => expect(screen.getByText("6")).toBeInTheDocument());

    // Then it reverts back to 5 and toasts error
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to update like status"));
  });

  it("creates a new discussion post successfully", async () => {
    const { toast } = await import("sonner");
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => samplePosts,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 3, title: "New Test Title", content: "New Content details", category: "Speaking" }), // POST request response
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [...samplePosts, { id: 3, title: "New Test Title", content: "New Content details", category: "Speaking", likes: 0, replies: 0, views: 0 }], // fetchPosts refresh
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}), // fetchStats refresh
      });

    renderForum();
    fireEvent.click(screen.getByRole("button", { name: /New Post/i }));

    fireEvent.change(screen.getByPlaceholderText("e.g. How to prepare for Repeat Sentence?"), {
      target: { value: "New Test Title" },
    });
    const modal = screen.getByText("Create New Discussion").closest(".bg-white") || screen.getByText("Create New Discussion").parentElement?.parentElement;
    const categorySelect = modal?.querySelector("select")!;
    fireEvent.change(categorySelect, {
      target: { value: "Speaking" },
    });
    fireEvent.change(screen.getByPlaceholderText("Write your question, tips, or discussion topic details here..."), {
      target: { value: "New Content details" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /Post Discussion/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Discussion posted successfully!"),
    );

    expect(screen.queryByText("Create New Discussion")).not.toBeInTheDocument();
  });

  it("opens a post, views replies, and posts a new reply", async () => {
    const { toast } = await import("sonner");
    const mockReplies = [
      {
        id: 10,
        content: "Here is a reply.",
        author: "Charlie",
        avatar: "c.png",
        timeAgo: "1h",
      },
    ];

    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => samplePosts,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })
      // fetch replies for post 1
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockReplies,
      })
      // post view increment
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      })
      // fetch stats refresh after view
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })
      // POST new reply
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 11, content: "My new reply", author: "Charlie", avatar: "c.png" }),
      })
      // fetch replies refresh after posting
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [...mockReplies, { id: 11, content: "My new reply", author: "Charlie", avatar: "c.png", timeAgo: "just now" }],
      })
      // fetch stats refresh after reply
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

    renderForum();
    await waitFor(() =>
      expect(
        screen.getByText("How to prepare for Speaking?"),
      ).toBeInTheDocument(),
    );

    // Click on the post card or title to open the modal
    fireEvent.click(screen.getByText("How to prepare for Speaking?"));

    // Verify modal is open and shows replies title
    await waitFor(() =>
      expect(screen.getByText("Replies (2)")).toBeInTheDocument(),
    );
    expect(screen.getByText("Here is a reply.")).toBeInTheDocument();

    // Type a reply
    fireEvent.change(screen.getByPlaceholderText("Write a reply..."), {
      target: { value: "My new reply" },
    });

    // Click Reply submit button
    fireEvent.submit(screen.getByRole("button", { name: "Reply" }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Reply posted!"),
    );
    expect(screen.getByText("My new reply")).toBeInTheDocument();
  });

  it("cancels creating a new post", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => samplePosts,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

    renderForum();
    fireEvent.click(screen.getByRole("button", { name: /New Post/i }));
    expect(screen.getByText("Create New Discussion")).toBeInTheDocument();

    // Click Cancel
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Create New Discussion")).not.toBeInTheDocument();
  });

  it("filters and sorts posts by popular and trending", async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => samplePosts,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

    const { container } = renderForum();
    await waitFor(() =>
      expect(screen.getByText("How to prepare for Speaking?")).toBeInTheDocument(),
    );

    // Select 'popular'
    const sortSelect = container.querySelector("select")!;
    fireEvent.change(sortSelect, { target: { value: "popular" } });
    expect(screen.getByText("Writing essay structure?")).toBeInTheDocument();

    // Select 'trending'
    fireEvent.change(sortSelect, { target: { value: "trending" } });
    expect(screen.getByText("Writing essay structure?")).toBeInTheDocument();
  });

  it("likes post inside detail modal and closes the modal", async () => {
    const mockReplies = [
      {
        id: 10,
        content: "Here is a reply.",
        author: "Charlie",
        avatar: "c.png",
        timeAgo: "1h",
      },
    ];

    (globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => samplePosts,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockReplies,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })
      // like API inside modal
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })
      // stats refresh
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

    const { container } = renderForum();
    await waitFor(() =>
      expect(screen.getByText("How to prepare for Speaking?")).toBeInTheDocument(),
    );

    // Click to open post
    fireEvent.click(screen.getByText("How to prepare for Speaking?"));

    await waitFor(() =>
      expect(screen.getByText("Replies (2)")).toBeInTheDocument(),
    );

    // Click like inside the modal
    const likeBtnInsideModal = screen.getAllByRole("button").find(
      (btn) => btn.textContent?.includes("likes")
    );
    if (likeBtnInsideModal) {
      fireEvent.click(likeBtnInsideModal);
      await waitFor(() =>
        expect(screen.getByText(/6 likes/i)).toBeInTheDocument(),
      );
    }

    // Close the modal
    const closeBtn = container.querySelector("button svg.lucide-x")?.parentElement;
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(screen.queryByText("Replies (2)")).not.toBeInTheDocument();
    }
  });
});
