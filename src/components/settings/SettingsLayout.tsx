"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Palette, SlidersHorizontal, UserRound, UsersRound, Shield, Settings2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTheme } from "@/context/ThemeContext";

const navigation = [
  { href: "/settings/profile", label: "Profile", icon: UserRound },
  { href: "/settings/account", label: "Account", icon: Settings2 },
  { href: "/settings/workspace", label: "Workspace", icon: UsersRound },
  { href: "/settings/preferences", label: "Preferences", icon: SlidersHorizontal },
  { href: "/settings/appearance", label: "Appearance", icon: Palette },
  { href: "/settings/security", label: "Security", icon: Shield },
];

export function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { preferencesError } = useTheme();
  return (
    <div className="grid min-w-0 gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8">
      <nav aria-label="Settings navigation" className="min-w-0 md:sticky md:top-24 md:self-start">
        <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Settings</h2>
        <ul className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
          {navigation.map(({ href, label, icon: Icon }) => {
            const selected = pathname === href;
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  aria-current={selected ? "page" : undefined}
                  className={`inline-flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                    selected
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="min-w-0">
        {preferencesError && <p role="alert" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">{preferencesError}</p>}
        {children}
      </div>
    </div>
  );
}
