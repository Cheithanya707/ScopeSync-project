"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "AI", href: "#ai" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <Logo />

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-slate-950">
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-medium text-slate-700 transition hover:text-slate-950">
            Log in
          </Link>
          <Button asChild size="sm">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 md:hidden"
          onClick={() => setMobileOpen((current) => !current)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-sm font-medium text-slate-700">Appearance</span>
              <ThemeToggle />
            </div>
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950" onClick={() => setMobileOpen(false)}>
              Log In
            </Link>
            <Button asChild className="mt-2 w-full" onClick={() => setMobileOpen(false)}>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
