"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Activity } from "@/types";
import { isLocalDataAvailable } from "@/lib/localData";
import { getProjectActivities, getRecentActivities } from "@/services/local/activityService";
import { useWorkspace } from "@/context/WorkspaceContext";
import { ActivityItem } from "@/components/activity/ActivityItem";

export function RecentActivity({ workspaceId, projectId, limit = 5 }: { workspaceId?: string; projectId?: string; limit?: number }) {
  const workspace = useWorkspace();
  const resolvedWorkspaceId = workspaceId ?? workspace.workspaceId;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(isLocalDataAvailable);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLocalDataAvailable) return;
    if (!resolvedWorkspaceId) {
      const timeoutId = window.setTimeout(() => setLoading(false), 0);
      return () => window.clearTimeout(timeoutId);
    }
    let current = true;
    const timeoutId = window.setTimeout(() => {
      void (projectId
        ? getProjectActivities(resolvedWorkspaceId, projectId, limit)
        : getRecentActivities(resolvedWorkspaceId, limit))
        .then((items) => { if (current) setActivities(items); })
        .catch((cause: unknown) => { if (current) setError(cause instanceof Error ? cause.message : "Activity could not be loaded."); })
        .finally(() => { if (current) setLoading(false); });
    }, 0);
    return () => { current = false; window.clearTimeout(timeoutId); };
  }, [resolvedWorkspaceId, projectId, limit]);

  if (!isLocalDataAvailable) {
    return <p className="rounded-lg bg-slate-50 p-4 text-sm text-muted-foreground">Activity history is available from the backend when your workspace is configured.</p>;
  }
  if (workspace.error && !resolvedWorkspaceId) {
    return (
      <div role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        <p>{workspace.error}</p>
        {workspace.error.includes("Complete workspace setup") ? (
          <Link className="mt-2 inline-block font-medium text-brand underline" href="/onboarding">
            Finish workspace setup
          </Link>
        ) : null}
      </div>
    );
  }
  if (loading) return <div role="status" aria-label="Loading recent activity" className="space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}</div>;
  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>;
  if (!activities.length) return <p className="rounded-lg bg-slate-50 p-4 text-sm text-muted-foreground">No activity yet. Important workspace and project actions will appear here.</p>;

  return <div className="divide-y divide-slate-100">{activities.slice(0, limit).map((activity) => <ActivityItem key={activity.id} activity={activity} compact />)}</div>;
}
