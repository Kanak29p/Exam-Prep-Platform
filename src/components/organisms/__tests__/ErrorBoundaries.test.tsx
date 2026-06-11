import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { ErrorBoundary } from "../ErrorBoundary";
import { GlobalErrorBoundary } from "../GlobalErrorBoundary";
import { PageErrorBoundary } from "../PageErrorBoundary";

function Bomb({ message = "boom" }: { message?: string }) {
  throw new Error(message);
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>safe content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("safe content")).toBeInTheDocument();
  });

  it("renders fallback when a child throws", () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(
      screen.getByText(/Something broke in this section/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Try Again/i }),
    ).toBeInTheDocument();
  });
});

describe("GlobalErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <GlobalErrorBoundary>
        <div>app content</div>
      </GlobalErrorBoundary>,
    );
    expect(screen.getByText("app content")).toBeInTheDocument();
  });

  it("renders error UI with the error message and resets via Restart App", () => {
    const originalLocation = window.location;
    const hrefSetter = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        set href(v: string) {
          hrefSetter(v);
        },
        get href() {
          return originalLocation.href;
        },
      },
    });

    render(
      <GlobalErrorBoundary>
        <Bomb message="kaboom" />
      </GlobalErrorBoundary>,
    );
    expect(
      screen.getByText(/Something went wrong/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Error: kaboom/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Restart App/i }));
    expect(hrefSetter).toHaveBeenCalledWith("/");

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });
});

describe("PageErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <PageErrorBoundary>
        <div>page content</div>
      </PageErrorBoundary>,
    );
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("renders fallback and reloads on Reload Page", () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    });

    render(
      <PageErrorBoundary>
        <Bomb />
      </PageErrorBoundary>,
    );
    expect(
      screen.getByText(/Something went wrong on this page/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Reload Page/i }));
    expect(reloadSpy).toHaveBeenCalled();
  });
});
