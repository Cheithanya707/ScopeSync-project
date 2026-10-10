"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareLinkCard({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/share/${encodeURIComponent(token)}`;

  const copy = async () => {
    setError("");
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("The link could not be copied. Select and copy it manually.");
    }
  };

  return <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
    <h2 className="font-semibold text-emerald-950">Share link</h2>
    <p className="mt-1 text-sm text-emerald-900">Send this link only to the person listed for this share.</p>
    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
      <input readOnly aria-label="Share link" value={link} onFocus={(event) => event.currentTarget.select()} className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-700" />
      <Button type="button" variant="outline" onClick={() => void copy()}>{copied ? "Link copied" : "Copy Link"}</Button>
    </div>
    {error && <p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}
    <p className="mt-3 text-xs text-emerald-900">In this disconnected preview, the link works only in this browser. Public cloud access needs a trusted server endpoint and is intentionally disabled.</p>
  </section>;
}
