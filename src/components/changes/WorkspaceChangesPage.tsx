"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { getProjects } from "@/services/projects/projectStore";
import { getScopeChanges } from "@/services/changes/changeStore";
import type { Project, ScopeChange } from "@/types";

type ProjectChanges = { project: Project; changes: ScopeChange[] };

export function WorkspaceChangesPage() {
  const { user } = useAuth();
  const workspace = useWorkspace();
  const ownerId = user?.uid ?? "local-preview-user";
  const activeWorkspaceId = workspace.workspaceId ?? ownerId;
  const [items, setItems] = useState<ProjectChanges[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!workspace.workspaceId) return;
    let current = true;
    void getProjects(ownerId, activeWorkspaceId).then(async (projects) =>
      Promise.all(projects.map(async (project) => ({ project, changes: await getScopeChanges(ownerId, project) })))
    ).then((results) => {
      if (current) setItems(results);
    }).catch(() => {
      if (current) setError("Unable to load workspace changes. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [activeWorkspaceId, ownerId, workspace.workspaceId]);

  const visibleItems = workspace.workspaceId ? items : [];
  const total = visibleItems.reduce((sum, item) => sum + item.changes.length, 0);
  const awaitingReview = visibleItems.reduce((sum, item) => sum + item.changes.filter((change) => change.status === "new" || change.status === "under_review").length, 0);

  return (
    <div>
      <p className="text-sm font-medium text-brand">Workspace</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Scope changes</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Review change requests across your projects and keep decisions connected to their original scope.</p>
      {workspace.workspaceId && error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {!error && <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Summary label="Total requests" value={total} />
        <Summary label="Awaiting review" value={awaitingReview} />
      </div>}
      {workspace.workspaceId && loading ? (
        <div role="status" className="mt-6 rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading project changes…</div>
      ) : error && workspace.workspaceId ? null : visibleItems.length ? (
        <section aria-label="Project change requests" className="mt-6 grid gap-3">
          {visibleItems.map(({ project, changes }) => {
            const pending = changes.filter((change) => change.status === "new" || change.status === "under_review").length;
            return <article key={project.id} className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{project.type.replaceAll("_", " ")}</p>
                <h2 className="mt-1 break-words text-base font-semibold text-slate-950">{project.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{changes.length} request{changes.length === 1 ? "" : "s"} · {pending} awaiting review</p>
              </div>
              <Button asChild variant="outline" className="w-full sm:w-auto"><Link href={`/projects/${project.id}/changes`}>Review changes<ArrowRight aria-hidden="true" /></Link></Button>
            </article>;
          })}
        </section>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-blue-50 text-brand"><GitCompareArrows aria-hidden="true" className="size-6" /></span>
          <h2 className="mt-4 text-lg font-semibold text-slate-950">Start with a project</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Create a project before recording requests that could affect its scope.</p>
          <Button asChild className="mt-5"><Link href="/projects/new">Create a project</Link></Button>
        </div>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-border bg-white p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{value}</p></div>;
}
