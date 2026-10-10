"use client";

import { useEffect } from "react";

export function ScrollReveal() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".landing-page [data-animate]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.setAttribute("data-reveal-visible", "true"));
      return;
    }

    items.forEach((item) => {
      const siblings = item.parentElement ? Array.from(item.parentElement.children) : [];
      const index = siblings.indexOf(item);
      item.style.setProperty("--reveal-delay", `${Math.min(index * 70, 280)}ms`);
    });
    document.documentElement.dataset.revealReady = "true";

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const item = entry.target as HTMLElement;
        item.setAttribute("data-reveal-visible", "true");
        observer.unobserve(item);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });

    items.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
      delete document.documentElement.dataset.revealReady;
      items.forEach((item) => {
        item.removeAttribute("data-reveal-visible");
        item.style.removeProperty("--reveal-delay");
      });
    };
  }, []);

  return null;
}
