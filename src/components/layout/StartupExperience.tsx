"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/src/ui/brand/Logo";

const INTRO_SEEN_KEY = "scopesync.company-intro.seen";
const INTRO_DURATION_MS = 2000;
const INTRO_EXIT_START_MS = 1750;

type IntroState = "checking" | "playing" | "exiting" | "hidden";

export function StartupExperience({ children }: { children: ReactNode }) {
  const [introState, setIntroState] = useState<IntroState>("checking");
  const hasCheckedIntro = useRef(false);

  useEffect(() => {
    if (hasCheckedIntro.current) return;
    hasCheckedIntro.current = true;

    let shouldPlay = true;
    try {
      shouldPlay = window.localStorage.getItem(INTRO_SEEN_KEY) !== "true";
      if (shouldPlay) window.localStorage.setItem(INTRO_SEEN_KEY, "true");
    } catch {
      shouldPlay = true;
    }
    setIntroState(shouldPlay ? "playing" : "hidden");
  }, []);

  useEffect(() => {
    if (introState !== "playing") return;
    const exitTimeout = window.setTimeout(() => setIntroState("exiting"), INTRO_EXIT_START_MS);
    return () => window.clearTimeout(exitTimeout);
  }, [introState]);

  useEffect(() => {
    if (introState !== "exiting") return;
    const finishTimeout = window.setTimeout(
      () => setIntroState("hidden"),
      INTRO_DURATION_MS - INTRO_EXIT_START_MS,
    );
    return () => window.clearTimeout(finishTimeout);
  }, [introState]);

  return (
    <div className="startup-experience" data-intro-state={introState}>
      <div className="startup-experience__content">{children}</div>
      {introState === "playing" || introState === "exiting" ? (
        <div
          aria-hidden="true"
          className={`brand-intro${introState === "exiting" ? " brand-intro--exiting" : ""}`}
        >
          <div className="brand-intro__backdrop" />
          <div className="brand-intro__content">
            <div className="brand-intro__orbit brand-intro__orbit--outer" />
            <div className="brand-intro__orbit brand-intro__orbit--inner" />
            <Logo className="brand-intro__logo" eager size="md" />
            <span className="brand-intro__tagline">PROJECTS, IN SYNC</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
