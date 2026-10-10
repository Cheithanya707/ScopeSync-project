"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { InlineLoader } from "@/src/ui/InlineLoader";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/dashboard");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3 text-foreground">
          <InlineLoader label="Loading your account" size={32} />
          <p className="text-sm font-medium">ScopeSync</p>
          <p className="text-xs text-muted-foreground">Loading your account...</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
