"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { enterWorkspaceAsGuest } from "@/lib/auth";
import { InlineLoader } from "@/src/ui/InlineLoader";

export function GuestWorkspaceRedirect() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(() => {
        enterWorkspaceAsGuest();
        if (active) router.replace("/dashboard");
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Could not open the workspace.");
        }
      });
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      {error ? (
        <p role="alert" className="max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      ) : (
        <div role="status" className="flex flex-col items-center gap-3">
          <InlineLoader label="Opening your workspace" size={32} />
          <p className="text-sm font-medium">Opening your ScopeSync workspace...</p>
        </div>
      )}
    </main>
  );
}
