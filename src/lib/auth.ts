import { AUTH_CHANGE_EVENT, API_TOKEN_KEY, LOCAL_USER_KEY, requestApi } from "@/lib/apiClient";
import { isLocalDataAvailable } from "@/lib/localData";
import {
  createGoogleProvider,
  getFirebaseAuth,
  isFirebaseConfigured,
} from "@/lib/firebaseClient";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";

export type LocalUser = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  workspaceId?: string | null;
  onboardingCompleted?: boolean;
  metadata: { creationTime: string; lastSignInTime: string };
  providerData: Array<{ providerId: string }>;
};

export type SignUpPayload = {
  name: string;
  email: string;
  password: string;
};

let cachedRaw: string | null | undefined;
let cachedUser: LocalUser | null = null;

function notifyAuthChange(): void {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

function saveSession(user: LocalUser, accessToken?: string): void {
  window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  if (accessToken) {
    window.localStorage.setItem(API_TOKEN_KEY, accessToken);
  } else {
    window.localStorage.removeItem(API_TOKEN_KEY);
  }
  cachedRaw = null;
  notifyAuthChange();
}

type AuthResponse = {
  accessToken: string;
  user: LocalUser;
};

function storeAuthResponse(response: AuthResponse): LocalUser {
  if (!response?.accessToken || !response.user?.uid || !response.user.email) {
    throw new Error("The backend returned an invalid authentication response.");
  }
  saveSession(response.user, response.accessToken);
  return response.user;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function getFriendlyAuthError(error: unknown): string {
  if (error instanceof Error && error.message === "LOCAL_GOOGLE_AUTH_UNAVAILABLE") {
    return "Google sign-in is not configured for this backend.";
  }
  if (error instanceof Error && error.message === "LOCAL_PASSWORD_RESET_UNAVAILABLE") {
    return "Password reset is not configured yet.";
  }
  if (
    error && typeof error === "object" && "code" in error &&
    typeof error.code === "string"
  ) {
    if (error.code === "auth/email-already-in-use") return "An account already exists for this email. Sign in instead.";
    if (error.code === "auth/invalid-credential") return "Email or password is incorrect.";
    if (error.code === "auth/weak-password") return "Choose a stronger password.";
    if (error.code === "auth/operation-not-allowed") return "Enable Email/Password and Google sign-in in Firebase Authentication.";
    if (error.code === "auth/popup-closed-by-user") return "Google sign-in was cancelled.";
    if (error.code === "auth/popup-blocked") return "Allow this site to open a Google sign-in window and try again.";
    if (error.code === "auth/unauthorized-domain") return "Add this website's domain to the Firebase authorized domains.";
    if (error.code === "auth/network-request-failed") return "Could not reach Firebase Authentication. Check your connection.";
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function getUserDestination(user: LocalUser | null): string {
  if (!user) return "/login";
  return user.workspaceId ? "/dashboard" : "/onboarding";
}

export function enterWorkspaceAsGuest(): LocalUser {
  if (isLocalDataAvailable) {
    throw new Error("Guest access is only available in standalone preview mode.");
  }
  const existingUser = getCurrentUser();
  if (existingUser) return existingUser;

  const now = new Date().toISOString();
  const user: LocalUser = {
    uid: `guest-${crypto.randomUUID()}`,
    email: "guest@scopesync.invalid",
    displayName: "Guest",
    photoURL: null,
    onboardingCompleted: true,
    metadata: { creationTime: now, lastSignInTime: now },
    providerData: [{ providerId: "guest" }],
  };
  saveSession(user);
  return user;
}

export function updateCurrentUserWorkspace(workspaceId: string): void {
  if (typeof window === "undefined") return;
  const user = getCurrentUser();
  if (!user) return;
  const accessToken = window.localStorage.getItem(API_TOKEN_KEY) ?? undefined;
  saveSession({ ...user, workspaceId, onboardingCompleted: true }, accessToken);
}

export async function signUpWithEmail({ name, email, password }: SignUpPayload): Promise<LocalUser> {
  if (!isValidEmail(email)) throw new Error("Please enter a valid email address.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );
  await updateProfile(credential.user, { displayName: name.trim() });
  return synchronizeFirebaseUser(credential.user);
}

export async function signInWithEmail(email: string, password: string): Promise<LocalUser> {
  if (!isValidEmail(email)) throw new Error("Please enter a valid email address.");
  if (!password) throw new Error("Enter your password.");
  const credential = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );
  return synchronizeFirebaseUser(credential.user);
}

export async function signInWithGoogle(): Promise<LocalUser> {
  const credential = await signInWithPopup(
    getFirebaseAuth(),
    createGoogleProvider(),
  );
  return synchronizeFirebaseUser(credential.user);
}

export async function signOutUser(): Promise<void> {
  if (isFirebaseConfigured()) await signOut(getFirebaseAuth());
  window.localStorage.removeItem(LOCAL_USER_KEY);
  window.localStorage.removeItem(API_TOKEN_KEY);
  cachedRaw = null;
  cachedUser = null;
  notifyAuthChange();
}

export async function sendPasswordReset(email: string): Promise<void> {
  if (!isValidEmail(email)) throw new Error("Enter a valid email address.");
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
}

async function synchronizeFirebaseUser(user: FirebaseUser): Promise<LocalUser> {
  const accessToken = await user.getIdToken();
  const response = await requestApi<AuthResponse>(
    "/api/auth/session",
    {
      method: "POST",
      body: JSON.stringify({ idToken: accessToken }),
    },
    { authenticated: false },
  );
  return storeAuthResponse({
    ...response,
    user: {
      ...response.user,
      displayName: user.displayName ?? response.user.displayName,
      photoURL: user.photoURL ?? response.user.photoURL,
      providerData: user.providerData.map(({ providerId }) => ({ providerId })),
      metadata: {
        creationTime: user.metadata.creationTime ?? response.user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime ?? response.user.metadata.lastSignInTime,
      },
    },
  });
}

export function getCurrentUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LOCAL_USER_KEY);
  const hasToken = Boolean(window.localStorage.getItem(API_TOKEN_KEY));
  if (raw === cachedRaw) return hasToken ? cachedUser : null;
  if (!raw) {
    cachedRaw = null;
    cachedUser = null;
    return null;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (
      value && typeof value === "object" &&
      "uid" in value && typeof value.uid === "string" &&
      "email" in value && typeof value.email === "string"
    ) {
      cachedUser = {
        uid: value.uid,
        email: value.email,
        displayName: "displayName" in value && typeof value.displayName === "string" ? value.displayName : null,
        photoURL: "photoURL" in value && typeof value.photoURL === "string" ? value.photoURL : null,
        workspaceId: "workspaceId" in value &&
          (typeof value.workspaceId === "string" || value.workspaceId === null)
          ? value.workspaceId
          : undefined,
        onboardingCompleted: "onboardingCompleted" in value && typeof value.onboardingCompleted === "boolean"
          ? value.onboardingCompleted
          : undefined,
        metadata: {
          creationTime: "metadata" in value && value.metadata && typeof value.metadata === "object" &&
            "creationTime" in value.metadata && typeof value.metadata.creationTime === "string"
            ? value.metadata.creationTime
            : "",
          lastSignInTime: "metadata" in value && value.metadata && typeof value.metadata === "object" &&
            "lastSignInTime" in value.metadata && typeof value.metadata.lastSignInTime === "string"
            ? value.metadata.lastSignInTime
            : "",
        },
        providerData: "providerData" in value && Array.isArray(value.providerData)
          ? value.providerData.filter(
              (provider): provider is { providerId: string } =>
                Boolean(provider) &&
                typeof provider === "object" &&
                "providerId" in provider &&
                typeof provider.providerId === "string",
            )
          : [],
      };
      cachedRaw = raw;
      if (!hasToken) {
        window.localStorage.removeItem(LOCAL_USER_KEY);
        cachedRaw = null;
        cachedUser = null;
        return null;
      }
      return cachedUser;
    }
  } catch {
    throw new Error("Saved ScopeSync account data could not be read. Sign in again to continue.");
  }
  throw new Error("Saved ScopeSync account data is invalid. Sign in again to continue.");
}

export function subscribeToAuthChanges(callback: () => void): () => void {
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
