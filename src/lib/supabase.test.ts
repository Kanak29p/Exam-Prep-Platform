import { describe, it, expect, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClientMock: vi.fn(() => ({
    storage: { from: () => ({}) },
    __isClient: true,
  })),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClientMock,
}));

import { supabase } from "./supabase";

describe("supabase client", () => {
  it("invokes createClient on module load and exports the resulting client", () => {
    expect(mocks.createClientMock).toHaveBeenCalledTimes(1);
    const [url, key] = mocks.createClientMock.mock.calls[0];
    expect(typeof url).toBe("string");
    expect(url).toMatch(/supabase\.co$/);
    expect(typeof key).toBe("string");
    expect(key.length).toBeGreaterThan(0);
    expect(supabase).toBeDefined();
    expect((supabase as any).__isClient).toBe(true);
  });
});
