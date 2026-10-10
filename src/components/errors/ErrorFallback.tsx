"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorFallbackProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  useEffect(() => {
    console.error("ScopeSync encountered a rendering error.", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <section
        aria-labelledby="error-title"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm"
      >
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle aria-hidden="true" className="size-6" />
        </span>
        <p className="mt-6 text-sm font-semibold text-destructive">Something went wrong</p>
        <h1 id="error-title" className="mt-2 text-2xl font-semibold tracking-tight">
          This page couldn’t be loaded
        </h1>
        <p role="alert" className="mt-3 text-sm leading-6 text-muted-foreground">
          Your saved browser data has not been cleared. Try again, or return to ScopeSync.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-muted-foreground">
            Error reference: <code>{error.digest}</code>
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>
            <RefreshCw aria-hidden="true" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft aria-hidden="true" />
              Return to ScopeSync
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
