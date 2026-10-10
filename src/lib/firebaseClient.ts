"use client";

import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Object.values(firebaseConfig).every((value) =>
    typeof value === "string" &&
    value.length > 0 &&
    !value.startsWith("replace-with-"),
  );
}

export function getFirebaseAuth(): Auth {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase Auth is not configured. Add the Firebase web app values to .env.local and restart the frontend.",
    );
  }

  const app = getApps().find((registered) => registered.name === "scopesync") ??
    initializeApp(firebaseConfig, "scopesync");
  return getAuth(app);
}

export async function getFreshFirebaseIdToken(): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
}

export function createGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}