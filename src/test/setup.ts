import "@testing-library/jest-dom";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

function setupFetchMock() {
  if (!globalThis.fetch || !(globalThis.fetch as any).mock) {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      }),
    );
  }
}

function setupURLMock() {
  if (typeof URL !== "undefined" && !URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => "blob:mock");
  }
  if (typeof URL !== "undefined" && !URL.revokeObjectURL) {
    URL.revokeObjectURL = vi.fn();
  }
}

function setupMediaRecorderMock() {
  if (!(globalThis as any).MediaRecorder) {
    class MockMediaRecorder {
      state = "inactive";
      ondataavailable: ((e: any) => void) | null = null;
      onstop: (() => void) | null = null;
      constructor(public stream: any) {}
      start() {
        this.state = "recording";
      }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob(["x"], { type: "audio/webm" }) });
        this.onstop?.();
      }
    }
    (globalThis as any).MediaRecorder = MockMediaRecorder;
  }
}

function setupNavigatorMocks() {
  if (!(navigator as any).mediaDevices) {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });
  }

  if (!(navigator as any).serviceWorker) {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue({ scope: "/" }),
        ready: Promise.resolve({ scope: "/" }),
      },
    });
  }
}

function setupNotificationMock() {
  if (!(globalThis as any).Notification) {
    (globalThis as any).Notification = {
      requestPermission: vi.fn().mockResolvedValue("granted"),
    };
  }
}

function setupWindowMocks() {
  if (typeof globalThis.window !== "undefined") {
    if (!globalThis.window.matchMedia) {
      Object.defineProperty(globalThis.window, "matchMedia", {
        writable: true,
        configurable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    }

    if (!globalThis.window.scrollTo) {
      globalThis.window.scrollTo = vi.fn() as any;
    }
  }
}

function setupObserverMocks() {
  if (typeof globalThis !== "undefined") {
    if (!(globalThis as any).IntersectionObserver) {
      class IO {
        observe() {
          // Mock observe method
          return;
        }
        unobserve() {
          // Mock unobserve method
          return;
        }
        disconnect() {
          // Mock disconnect method
          return;
        }
        takeRecords() {
          return [];
        }
      }
      (globalThis as any).IntersectionObserver = IO;
      if (typeof globalThis.window !== "undefined") {
        (globalThis.window as any).IntersectionObserver = IO;
      }
    }

    if (!(globalThis as any).ResizeObserver) {
      class RO {
        observe() {
          // Mock observe method
          return;
        }
        unobserve() {
          // Mock unobserve method
          return;
        }
        disconnect() {
          // Mock disconnect method
          return;
        }
      }
      (globalThis as any).ResizeObserver = RO;
      if (typeof globalThis.window !== "undefined") {
        (globalThis.window as any).ResizeObserver = RO;
      }
    }
  }
}

beforeEach(() => {
  setupFetchMock();
  setupURLMock();
  setupMediaRecorderMock();
  setupNavigatorMocks();
  setupNotificationMock();
  setupWindowMocks();
  setupObserverMocks();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});
