import { vi } from "vitest";

export const signInWithEmailAndPasswordMock = vi.fn();
export const createUserWithEmailAndPasswordMock = vi.fn();
export const sendEmailVerificationMock = vi.fn();
export const signInWithPopupMock = vi.fn();
export const signOutMock = vi.fn().mockResolvedValue(undefined);
export const sendPasswordResetEmailMock = vi.fn();
export const linkWithCredentialMock = vi.fn();
export const emailAuthCredentialMock = vi.fn(
  (email: string, password: string) => ({
    providerId: "password",
    email,
    password,
  }),
);

export const getTokenMock = vi.fn().mockResolvedValue("fake-fcm-token");
export const onMessageMock = vi.fn(() => () => undefined);

export const mockAuth: { currentUser: any } = {
  currentUser: null,
};

export const mockProvider = { providerId: "google.com" };
export const mockMessaging = { __mock: true };

export function setCurrentUser(user: any) {
  mockAuth.currentUser = user;
}

export function resetFirebaseMocks() {
  signInWithEmailAndPasswordMock.mockReset();
  createUserWithEmailAndPasswordMock.mockReset();
  sendEmailVerificationMock.mockReset();
  signInWithPopupMock.mockReset();
  signOutMock.mockReset().mockResolvedValue(undefined);
  sendPasswordResetEmailMock.mockReset();
  linkWithCredentialMock.mockReset();
  emailAuthCredentialMock.mockClear();
  getTokenMock.mockReset().mockResolvedValue("fake-fcm-token");
  onMessageMock.mockReset().mockImplementation(() => () => undefined);
  mockAuth.currentUser = null;
}
