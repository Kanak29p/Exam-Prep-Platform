import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { NotFoundPage } from "../NotFoundPage";

describe("NotFoundPage", () => {
  it("renders the 404 heading and description", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
    expect(screen.getByText("Page not found.")).toBeInTheDocument();
  });

  it("renders Home and Dashboard links with correct hrefs", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
