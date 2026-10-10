"use client";

import { ErrorFallback } from "@/components/errors/ErrorFallback";
import "./globals.css";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorFallback error={error} reset={reset} />
      </body>
    </html>
  );
}
