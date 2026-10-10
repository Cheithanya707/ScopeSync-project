"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserPreferences } from "@/services/local/preferencesService";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  compactMode: boolean;
  setCompactMode: (enabled: boolean) => void;
  preferencesError: string;
}

const STORAGE_KEY = "scopesync-appearance";
const COMPACT_KEY = "scopesync-compact-mode";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readMode(): ThemeMode {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function readCompactMode(): boolean {
  return window.localStorage.getItem(COMPACT_KEY) === "true";
}

function subscribeToPreferences(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener("scopesync-preferences-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("scopesync-preferences-change", callback);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferencesError, setPreferencesErrorState] = useState<{ userId: string; message: string } | null>(null);
  const mode = useSyncExternalStore(subscribeToPreferences, readMode, () => "system" as ThemeMode);
  const compactMode = useSyncExternalStore(subscribeToPreferences, readCompactMode, () => false);
  const setMode = useCallback((nextMode: ThemeMode) => {
    window.localStorage.setItem(STORAGE_KEY, nextMode);
    window.dispatchEvent(new Event("scopesync-preferences-change"));
  }, []);
  const setCompactMode = useCallback((enabled: boolean) => {
    window.localStorage.setItem(COMPACT_KEY, String(enabled));
    window.dispatchEvent(new Event("scopesync-preferences-change"));
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const useDark = mode === "dark" || (mode === "system" && media.matches);
      document.documentElement.classList.toggle("dark", useDark);
      document.documentElement.classList.toggle("light", !useDark);
      document.documentElement.style.colorScheme = useDark ? "dark" : "light";
    };
    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [mode]);

  useEffect(() => { document.documentElement.dataset.compact = String(compactMode); }, [compactMode]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void getUserPreferences(user.uid).then((preferences) => {
      if (!active) return;
      setPreferencesErrorState(null);
      if (typeof preferences?.compactMode === "boolean") setCompactMode(preferences.compactMode);
    }).catch(() => {
      if (active) setPreferencesErrorState({ userId: user.uid, message: "Saved preferences could not be loaded. Open Settings to retry." });
    });
    return () => { active = false; };
  }, [user, setCompactMode]);

  const value = useMemo(() => ({
    mode,
    setMode,
    compactMode,
    setCompactMode,
    preferencesError: preferencesError && preferencesError.userId === user?.uid ? preferencesError.message : "",
  }), [mode, setMode, compactMode, setCompactMode, preferencesError, user?.uid]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside a ThemeProvider");
  return context;
}
