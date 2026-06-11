import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, renderHook, waitFor } from "@testing-library/react";

import {
  signInWithEmailAndPasswordMock,
  createUserWithEmailAndPasswordMock,
  sendEmailVerificationMock,
  signInWithPopupMock,
  signOutMock,
  sendPasswordResetEmailMock,
  resetFirebaseMocks,
} from "../test/mocks/firebase";

vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: (...args: any[]) =>
    (signInWithEmailAndPasswordMock as any)(...args),
  createUserWithEmailAndPassword: (...args: any[]) =>
    (createUserWithEmailAndPasswordMock as any)(...args),
  sendEmailVerification: (...args: any[]) =>
    (sendEmailVerificationMock as any)(...args),
  signInWithPopup: (...args: any[]) => (signInWithPopupMock as any)(...args),
  signOut: (...args: any[]) => (signOutMock as any)(...args),
  sendPasswordResetEmail: (...args: any[]) =>
    (sendPasswordResetEmailMock as any)(...args),
}));

vi.mock("../lib/firebase", () => ({
  auth: { currentUser: null as any },
  provider: { providerId: "google.com" },
  messaging: null,
}));

import { AuthProvider, useAuth } from "./AuthContext";
import * as firebaseLib from "../lib/firebase";

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

function makeFetchOk(json: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => json,
  };
}

function makeFetchErr(json: any, status = 400) {
  return {
    ok: false,
    status,
    json: async () => json,
  };
}

beforeEach(() => {
  resetFirebaseMocks();
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn());
  (firebaseLib as any).auth.currentUser = null;
});

describe("AuthContext - hydration", () => {
  it("starts unauthenticated when localStorage is empty", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("rehydrates user from localStorage", async () => {
    localStorage.setItem("token", "tok-1");
    localStorage.setItem(
      "user",
      JSON.stringify({ id: "u1", name: "Hydrated", email: "h@t.com", role: "student" }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user?.email).toBe("h@t.com");
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("clears localStorage when stored user is malformed", async () => {
    localStorage.setItem("token", "tok-bad");
    localStorage.setItem("user", "{not-json");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(result.current.user).toBeNull();

    errorSpy.mockRestore();
  });
});

describe("AuthContext - login", () => {
  it("logs in and persists session for verified email user", async () => {
    const fakeUser = {
      reload: vi.fn().mockResolvedValue(undefined),
      providerData: [{ providerId: "password" }],
      getIdToken: vi.fn().mockResolvedValue("firebase-token"),
    };
    signInWithEmailAndPasswordMock.mockResolvedValue({ user: fakeUser });
    (firebaseLib as any).auth.currentUser = {
      ...fakeUser,
      emailVerified: true,
      providerData: [{ providerId: "password" }],
    };

    (globalThis.fetch as any).mockResolvedValue(
      makeFetchOk({
        token: "backend-token",
        user: {
          id: "srv-1",
          name: "Server User",
          email: "srv@test.com",
          role: "student",
        },
      }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login("Foo@Test.com  ", "secret123");
    });

    expect(signInWithEmailAndPasswordMock).toHaveBeenCalledWith(
      expect.anything(),
      "foo@test.com",
      "secret123",
    );
    expect(localStorage.getItem("token")).toBe("backend-token");
    expect(JSON.parse(localStorage.getItem("user")!).email).toBe("foo@test.com");
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("blocks unverified non-Google email and signs out", async () => {
    const fakeUser = {
      reload: vi.fn().mockResolvedValue(undefined),
      providerData: [{ providerId: "password" }],
      getIdToken: vi.fn(),
    };
    signInWithEmailAndPasswordMock.mockResolvedValue({ user: fakeUser });
    (firebaseLib as any).auth.currentUser = {
      ...fakeUser,
      emailVerified: false,
      providerData: [{ providerId: "password" }],
    };

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(
      act(async () => {
        await result.current.login("a@b.com", "pw");
      }),
    ).rejects.toThrow(/verify your email/i);

    expect(signOutMock).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("allows unverified email when Google is linked", async () => {
    const fakeUser = {
      reload: vi.fn().mockResolvedValue(undefined),
      providerData: [{ providerId: "google.com" }],
      getIdToken: vi.fn().mockResolvedValue("ft"),
    };
    signInWithEmailAndPasswordMock.mockResolvedValue({ user: fakeUser });
    (firebaseLib as any).auth.currentUser = {
      ...fakeUser,
      emailVerified: false,
      providerData: [{ providerId: "google.com" }],
    };
    (globalThis.fetch as any).mockResolvedValue(
      makeFetchOk({
        token: "ok",
        user: { id: "u", name: "G", email: "g@t.com", role: "student" },
      }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login("g@t.com", "pw");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("propagates backend error message", async () => {
    const fakeUser = {
      reload: vi.fn().mockResolvedValue(undefined),
      providerData: [{ providerId: "password" }],
      getIdToken: vi.fn().mockResolvedValue("ft"),
    };
    signInWithEmailAndPasswordMock.mockResolvedValue({ user: fakeUser });
    (firebaseLib as any).auth.currentUser = {
      ...fakeUser,
      emailVerified: true,
      providerData: [{ providerId: "password" }],
    };
    (globalThis.fetch as any).mockResolvedValue(
      makeFetchErr({ message: "User not found" }, 404),
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.login("a@b.com", "pw");
      }),
    ).rejects.toThrow("User not found");
    errorSpy.mockRestore();
  });
});

describe("AuthContext - googleLogin / googleSignup", () => {
  it("googleLogin success stores token + user", async () => {
    const googleUser = {
      uid: "g-uid",
      email: "g@x.com",
      displayName: "Goog",
      photoURL: "ph",
      getIdToken: vi.fn().mockResolvedValue("g-tok"),
    };
    signInWithPopupMock.mockResolvedValue({ user: googleUser });
    (globalThis.fetch as any).mockResolvedValue(
      makeFetchOk({
        token: "back-tok",
        user: {
          id: "g-id",
          name: "Goog",
          email: "g@x.com",
          role: "student",
        },
      }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.googleLogin();
    });

    expect(localStorage.getItem("token")).toBe("back-tok");
    expect(result.current.user?.email).toBe("g@x.com");
  });

  it("googleLogin signs out and rethrows when backend rejects", async () => {
    const googleUser = {
      uid: "g-uid",
      email: "g@x.com",
      displayName: "Goog",
      photoURL: null,
      getIdToken: vi.fn().mockResolvedValue("g-tok"),
    };
    signInWithPopupMock.mockResolvedValue({ user: googleUser });
    (globalThis.fetch as any).mockResolvedValue(
      makeFetchErr({ message: "Please signup first" }, 404),
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.googleLogin();
      }),
    ).rejects.toThrow("Please signup first");
    expect(signOutMock).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("googleSignup returns user data with isNewUser flag and firebaseToken", async () => {
    const googleUser = {
      uid: "g-uid",
      email: "newg@x.com",
      displayName: "New",
      photoURL: "p",
      getIdToken: vi.fn().mockResolvedValue("g-tok"),
    };
    signInWithPopupMock.mockResolvedValue({ user: googleUser });
    (globalThis.fetch as any).mockResolvedValue(
      makeFetchOk({ isNewUser: true }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let returned: any;
    await act(async () => {
      returned = await result.current.googleSignup();
    });

    expect(returned.isNewUser).toBe(true);
    expect(returned.firebaseToken).toBe("g-tok");
    expect(returned.email).toBe("newg@x.com");
  });

  it("googleSignup propagates errors", async () => {
    signInWithPopupMock.mockRejectedValue(new Error("popup closed"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.googleSignup();
      }),
    ).rejects.toThrow("popup closed");
    errorSpy.mockRestore();
  });
});

describe("AuthContext - signup", () => {
  it("creates user, sends verification email, signs out, then posts to backend", async () => {
    createUserWithEmailAndPasswordMock.mockResolvedValue({
      user: { uid: "u1" },
    });
    sendEmailVerificationMock.mockResolvedValue(undefined);
    (globalThis.fetch as any).mockResolvedValue(makeFetchOk({}));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signup("Bob", "BOB@Test.com", "pw1234");
    });

    expect(createUserWithEmailAndPasswordMock).toHaveBeenCalledWith(
      expect.anything(),
      "bob@test.com",
      "pw1234",
    );
    expect(sendEmailVerificationMock).toHaveBeenCalled();
    expect(signOutMock).toHaveBeenCalled();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/signup"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejects when backend returns error", async () => {
    createUserWithEmailAndPasswordMock.mockResolvedValue({ user: { uid: "u1" } });
    sendEmailVerificationMock.mockResolvedValue(undefined);
    (globalThis.fetch as any).mockResolvedValue(
      makeFetchErr({ message: "Email exists" }, 409),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.signup("X", "x@x.com", "pw1234");
      }),
    ).rejects.toThrow("Email exists");
    errorSpy.mockRestore();
  });
});

describe("AuthContext - logout / sendPasswordReset", () => {
  it("logout clears storage even if signOut throws", async () => {
    signOutMock.mockRejectedValueOnce(new Error("network"));
    localStorage.setItem("token", "t");
    localStorage.setItem(
      "user",
      JSON.stringify({ id: "x", name: "X", email: "x@x.com", role: "student" }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(result.current.user).toBeNull();
    errorSpy.mockRestore();
  });

  it("sendPasswordReset sanitizes email", async () => {
    sendPasswordResetEmailMock.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.sendPasswordReset("  USER@TEST.com ");
    });

    expect(sendPasswordResetEmailMock).toHaveBeenCalledWith(
      expect.anything(),
      "user@test.com",
    );
  });

  it("sendPasswordReset propagates errors", async () => {
    sendPasswordResetEmailMock.mockRejectedValue(new Error("not found"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.sendPasswordReset("a@b.com");
      }),
    ).rejects.toThrow("not found");
    errorSpy.mockRestore();
  });
});

describe("useAuth hook", () => {
  it("throws when used outside AuthProvider", () => {
    function Probe() {
      useAuth();
      return null;
    }
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow(
      /useAuth must be used within an AuthProvider/i,
    );
    errorSpy.mockRestore();
  });
});
