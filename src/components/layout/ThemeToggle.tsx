"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const [systemDark, setSystemDark] = useState(false);
  const isDark = mode === "dark" || (mode === "system" && systemDark);
  const nextMode = isDark ? "light" : "dark";

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => setSystemDark(media.matches);
    updateSystemTheme();
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, []);

  return (
    <button
      type="button"
      aria-label={`Switch to ${nextMode} mode`}
      title={`Switch to ${nextMode} mode`}
      aria-pressed={isDark}
      onClick={() => setMode(nextMode)}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-[color,background-color,border-color,transform] hover:-translate-y-0.5 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {isDark ? <Sun aria-hidden="true" className="size-4" /> : <Moon aria-hidden="true" className="size-4" />}
    </button>
  );
}
