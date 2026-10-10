"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  getFriendlyAuthError,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
  sendPasswordReset,
  subscribeToAuthChanges,
  type LocalUser,
} from "@/lib/auth";

type AuthContextValue = {
  user: LocalUser | null;
  loading: boolean;
  authActionPending: boolean;
  signUpWithEmail: (payload: { name: string; email: string; password: string }) => Promise<LocalUser>;
  signInWithEmail: (email: string, password: string) => Promise<LocalUser>;
  signInWithGoogle: () => Promise<LocalUser>;
  signOutUser: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  getFriendlyAuthError: (error: unknown) => string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const storedUser = useSyncExternalStore(
    subscribeToAuthChanges,
    getCurrentUser,
    () => undefined,
  );
  const user = storedUser ?? null;
  const loading = storedUser === undefined;
  const [authActionPending, setAuthActionPending] = useState(false);

  const runAuthAction = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    setAuthActionPending(true);
    try {
      return await action();
    } finally {
      setAuthActionPending(false);
    }
  }, []);

  const handleSignUpWithEmail = useCallback(
    (payload: { name: string; email: string; password: string }) => runAuthAction(() => signUpWithEmail(payload)),
    [runAuthAction],
  );
  const handleSignInWithEmail = useCallback(
    (email: string, password: string) => runAuthAction(() => signInWithEmail(email, password)),
    [runAuthAction],
  );
  const handleSignInWithGoogle = useCallback(
    () => runAuthAction(signInWithGoogle),
    [runAuthAction],
  );
  const handleSignOut = useCallback(
    () => runAuthAction(signOutUser),
    [runAuthAction],
  );
  const handlePasswordReset = useCallback(
    (email: string) => runAuthAction(() => sendPasswordReset(email)),
    [runAuthAction],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      authActionPending,
      signUpWithEmail: handleSignUpWithEmail,
      signInWithEmail: handleSignInWithEmail,
      signInWithGoogle: handleSignInWithGoogle,
      signOutUser: handleSignOut,
      sendPasswordReset: handlePasswordReset,
      getFriendlyAuthError,
    }),
    [user, loading, authActionPending, handleSignUpWithEmail, handleSignInWithEmail, handleSignInWithGoogle, handleSignOut, handlePasswordReset],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}

export function useCurrentUser(): LocalUser | null {
  return getCurrentUser();
}
