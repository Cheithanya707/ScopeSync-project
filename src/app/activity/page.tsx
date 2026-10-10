"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ActivityFilters } from "@/components/activity/ActivityFilters";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { isLocalDataAvailable } from "@/lib/localData";
import { getWorkspaceActivities } from "@/services/local/activityService";
import { getProjects } from "@/services/projects/projectStore";
import type { Activity, ActivityAction, ActivityEntityType, Project } from "@/types";

const ACTIVITY_ENTITIES = new Set<ActivityEntityType>(["workspace", "project", "requirement", "task", "scope_change", "document", "payment", "member", "calendar"]);
const ACTIVITY_ACTIONS = new Set<ActivityAction>(["created", "updated", "deleted", "completed", "assigned", "unassigned", "approved", "rejected", "submitted", "uploaded", "paid", "invited", "removed", "status_changed"]);

export default function ActivityPage() {
  const { user } = useAuth();
  const workspace = useWorkspace();
  const ownerId = user?.uid ?? "local-preview-user";
  const activeWorkspaceId = workspace.workspaceId ?? ownerId;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(isLocalDataAvailable);
  const [error, setError] = useState("");
  const [entity, setEntity] = useState<ActivityEntityType | "all">("all");
  const [action, setAction] = useState<ActivityAction | "all">("all");
  const [projectId, setProjectId] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const projectParam = params.get("projectId");
      if (projectParam) setProjectId(projectParam);
      const typeParam = params.get("type");
      if (typeParam && ACTIVITY_ENTITIES.has(typeParam as ActivityEntityType)) setEntity(typeParam as ActivityEntityType);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!workspace.workspaceId) return;
    let current = true;
    const timeoutId = window.setTimeout(() => {
      void getProjects(ownerId, activeWorkspaceId).then((items) => { if (current) setProjects(items); }).catch(() => {
        if (current) setError("Project filters could not be loaded.");
      });
    }, 0);
    return () => { current = false; window.clearTimeout(timeoutId); };
  }, [activeWorkspaceId, ownerId, workspace.workspaceId]);

  useEffect(() => {
    if (!isLocalDataAvailable) return;
    if (!workspace.workspaceId) {
      const timeoutId = window.setTimeout(() => setLoading(false), 0);
      return () => window.clearTimeout(timeoutId);
    }
    let current = true;
    const timeoutId = window.setTimeout(() => {
      void getWorkspaceActivities(workspace.workspaceId!, 100).then((items) => {
        if (current) setActivities(items);
      }).catch((cause: unknown) => {
        if (current) setError(cause instanceof Error ? cause.message : "Activity could not be loaded. Please try again.");
      }).finally(() => {
        if (current) setLoading(false);
      });
    }, 0);
    return () => { current = false; window.clearTimeout(timeoutId); };
  }, [workspace.workspaceId]);

  const visibleActivities = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return activities.filter((activity) => {
      if (entity !== "all" && activity.entityType !== entity) return false;
      if (action !== "all" && activity.action !== action) return false;
      if (projectId !== "all" && activity.projectId !== projectId && !(activity.entityType === "project" && activity.entityId === projectId)) return false;
      if (term && !`${activity.actorName} ${activity.entityName} ${activity.description}`.toLocaleLowerCase().includes(term)) return false;
      return true;
    });
  }, [activities, action, entity, projectId, search]);
  const visibleProjects = workspace.workspaceId ? projects : [];

  const updateProjectFilter = (next: string) => {
    setProjectId(next);
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("projectId");
    else url.searchParams.set("projectId", next);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  };
  const updateEntityFilter = (next: ActivityEntityType | "all") => {
    setEntity(next);
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("type");
    else url.searchParams.set("type", next);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">Workspace history</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Activity</h1>
          <p className="mt-2 text-sm text-muted-foreground">A history of important actions across your workspace.</p>
        </div>
        <Button asChild variant="outline"><Link href="/dashboard">Back to dashboard</Link></Button>
      </div>

      {workspace.error && isLocalDataAvailable && <p role="alert" className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{workspace.error}</p>}
      {!isLocalDataAvailable ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Activity history is saved only in this browser.</p>
      ) : (
        <>
          <div className="mt-6"><ActivityFilters projects={visibleProjects} entity={entity} action={action} projectId={projectId} search={search} onEntityChange={updateEntityFilter} onActionChange={(value) => setAction(ACTIVITY_ACTIONS.has(value as ActivityAction) ? value : "all")} onProjectChange={updateProjectFilter} onSearchChange={setSearch} /></div>
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {activities.length >= 100 && <p className="mt-4 text-xs text-muted-foreground">Showing up to the 100 most recent activity records.</p>}
          <div className="mt-5"><ActivityTimeline activities={visibleActivities} loading={loading || workspace.loading} /></div>
        </>
      )}
    </div>
  );
}
