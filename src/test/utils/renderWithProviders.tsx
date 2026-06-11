import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { TestUser } from "./factories";

interface RenderOpts extends Omit<RenderOptions, "wrapper"> {
  initialEntries?: string[];
}

export function renderWithRouter(ui: React.ReactElement, opts: RenderOpts = {}) {
  const { initialEntries = ["/"], ...rest } = opts;
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    ),
    ...rest,
  });
}

export interface MockAuthValue {
  user: TestUser | null;
  setUser: (u: any) => void;
  login: (...args: any[]) => Promise<any>;
  signup: (...args: any[]) => Promise<any>;
  logout: () => Promise<any>;
  googleSignup: () => Promise<any>;
  googleLogin: () => Promise<any>;
  sendPasswordReset: (email: string) => Promise<any>;
  isAuthenticated: boolean;
  loading: boolean;
}

export function createMockAuth(overrides: Partial<MockAuthValue> = {}): MockAuthValue {
  return {
    user: null,
    setUser: () => undefined,
    login: async () => undefined,
    signup: async () => undefined,
    logout: async () => undefined,
    googleSignup: async () => undefined,
    googleLogin: async () => undefined,
    sendPasswordReset: async () => undefined,
    isAuthenticated: false,
    loading: false,
    ...overrides,
  };
}
