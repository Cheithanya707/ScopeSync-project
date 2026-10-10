"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MemberAvatar } from "@/components/people/MemberAvatar";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";

export function UserProfileMenu({ placement = "header" }: { placement?: "header" | "sidebar" }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOutUser } = useAuth();
  const { profile } = useWorkspace();
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const name = profile?.displayName || user?.displayName || "Account";

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !detailsRef.current?.contains(event.target)) {
        detailsRef.current?.removeAttribute("open");
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") detailsRef.current?.removeAttribute("open");
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    detailsRef.current?.removeAttribute("open");
  }, [pathname]);

  if (!user) return null;

  const handleSignOut = async () => {
    setError("");
    setSigningOut(true);
    try {
      await signOutUser();
      router.push("/login");
    } catch {
      setError("You could not be signed out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <details ref={detailsRef} className="relative shrink-0">
      <summary
        aria-label={`${name} account menu`}
        className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full outline-none ring-brand focus-visible:ring-2 [&::-webkit-details-marker]:hidden"
      >
        <MemberAvatar name={name} photoURL={profile?.photoURL || user.photoURL || undefined} size="sm" />
      </summary>
      <div className={`absolute z-50 w-64 rounded-xl border border-border bg-white p-2 shadow-lg ${placement === "sidebar" ? "bottom-0 left-full ml-2" : "right-0 mt-2"}`}>
        <div className="border-b border-border px-3 py-2">
          <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>
        <Link href="/settings/profile" className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          <UserRound aria-hidden="true" className="size-4" /> Profile
        </Link>
        <Link href="/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          <Settings aria-hidden="true" className="size-4" /> Settings
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60"
        >
          <LogOut aria-hidden="true" className="size-4" /> {signingOut ? "Signing out..." : "Log out"}
        </button>
        {error && <p role="alert" className="px-3 py-2 text-xs text-red-700">{error}</p>}
      </div>
    </details>
  );
}
