"use client";

import { X } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";

export function ActivitySyncNotice() {
  const { activityError, clearActivityError } = useWorkspace();
  if (!activityError) return null;
  return (
    <div role="alert" className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p>{activityError}</p>
      <button type="button" aria-label="Dismiss activity sync warning" onClick={clearActivityError} className="shrink-0 rounded p-1 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"><X aria-hidden="true" className="size-4" /></button>
    </div>
  );
}
