import { describe, it, expect } from "vitest";

import { API_BASE_URL } from "./api";

describe("API_BASE_URL", () => {
  it("falls back to localhost when VITE_API_BASE_URL is not set", () => {
    if (import.meta.env.VITE_API_BASE_URL) {
      expect(API_BASE_URL).toBe(import.meta.env.VITE_API_BASE_URL);
    } else {
      expect(API_BASE_URL).toBe("http://localhost:5001");
    }
  });

  it("is a non-empty string", () => {
    expect(typeof API_BASE_URL).toBe("string");
    expect(API_BASE_URL.length).toBeGreaterThan(0);
  });
});
