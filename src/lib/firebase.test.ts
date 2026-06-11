import { describe, it, expect, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  initializeAppMock: vi.fn(() => ({ name: "fake-app" })),
  getAuthMock: vi.fn(() => ({ kind: "auth" })),
  getMessagingMock: vi.fn(() => ({ kind: "messaging" })),
  GoogleAuthProviderCtor: vi.fn(function (this: any) {
    this.providerId = "google.com";
  }),
}));

vi.mock("firebase/app", () => ({
  initializeApp: mocks.initializeAppMock,
}));

vi.mock("firebase/auth", () => ({
  getAuth: mocks.getAuthMock,
  GoogleAuthProvider: mocks.GoogleAuthProviderCtor,
}));

vi.mock("firebase/messaging", () => ({
  getMessaging: mocks.getMessagingMock,
}));

import { auth, provider, messaging } from "./firebase";

describe("firebase library", () => {
  it("wires firebase initialization on module load", () => {
    expect(mocks.initializeAppMock).toHaveBeenCalledTimes(1);
    const config = mocks.initializeAppMock.mock.calls[0][0] as any;
    expect(config).toHaveProperty("apiKey");
    expect(config).toHaveProperty("projectId");
    expect(config).toHaveProperty("appId");

    expect(mocks.getAuthMock).toHaveBeenCalledTimes(1);
    expect(auth).toEqual({ kind: "auth" });

    expect(mocks.GoogleAuthProviderCtor).toHaveBeenCalledTimes(1);
    expect(provider).toBeInstanceOf(mocks.GoogleAuthProviderCtor as any);

    expect(mocks.getMessagingMock).toHaveBeenCalled();
    expect(messaging).toEqual({ kind: "messaging" });
  });
});
