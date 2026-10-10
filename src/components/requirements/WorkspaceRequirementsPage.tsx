"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { getProjects } from "@/services/projects/projectStore";
import { getWorkspaceRequirements } from "@/services/requirements/requirementStore";
import type { Project, Requirement } from "@/types";

export function WorkspaceRequirementsPage() {
  const { user } = useAuth();
  const workspace = useWorkspace();
  const ownerId = user?.uid ?? "local-preview-user";
  const activeWorkspaceId = workspace.workspaceId ?? ownerId;
  const [projects, setProjects] = useState<Project[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!workspace.workspaceId) return;
    let current = true;
    void Promise.all([
      getProjects(ownerId, activeWorkspaceId),
      getWorkspaceRequirements(ownerId, activeWorkspaceId),
    ]).then(([projectItems, requirementItems]) => {
      if (!current) return;
      setProjects(projectItems);
      setRequirements(requirementItems);
    }).catch(() => {
      if (current) setError("Unable to load workspace requirements. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [activeWorkspaceId, ownerId, workspace.workspaceId]);

  const visibleProjects = workspace.workspaceId ? projects : [];
  const visibleRequirements = workspace.workspaceId ? requirements : [];
  const approved = visibleRequirements.filter((item) => item.status === "approved").length;
  const active = visibleRequirements.filter((item) => item.status !== "archived").length;

  return (
    <div>
      <div>
        <p className="text-sm font-medium text-brand">Workspace</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Requirements</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Browse project expectations and acceptance criteria in one place.</p>
      </div>
      {workspace.workspaceId && error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {!error && <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Summary label="Active requirements" value={active} icon={FileText} />
        <Summary label="Approved requirements" value={approved} icon={CheckCircle2} />
      </div>}
      {workspace.workspaceId && loading ? (
        <div role="status" className="mt-6 rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading projects…</div>
      ) : error && workspace.workspaceId ? null : visibleProjects.length ? (
        <section aria-label="Project requirements" className="mt-6 grid gap-3">
          {visibleProjects.map((project) => {
            const projectRequirements = visibleRequirements.filter((item) => item.projectId === project.id);
            return (
              <article key={project.id} className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{project.type.replaceAll("_", " ")}</p>
                  <h2 className="mt-1 break-words text-base font-semibold text-slate-950">{project.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{projectRequirements.length} requirement{projectRequirements.length === 1 ? "" : "s"} · {projectRequirements.filter((item) => item.status === "approved").length} approved</p>
                </div>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href={`/projects/${project.id}/requirements`}>Open requirements<ArrowRight aria-hidden="true" /></Link>
                </Button>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-blue-50 text-brand"><FileText aria-hidden="true" className="size-6" /></span>
          <h2 className="mt-4 text-lg font-semibold text-slate-950">Start with a project</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Requirements belong to a project. Create one first, then add scope, acceptance criteria, and approval status.</p>
          <Button asChild className="mt-5"><Link href="/projects/new">Create a project</Link></Button>
        </div>
      )}
    </div>
  );
}

function Summary({ label, value, icon: Icon }: { label: string; value: number; icon: typeof FileText }) {
  return <div className="flex items-center justify-between rounded-xl border border-border bg-white p-4"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{value}</p></div><span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-brand"><Icon aria-hidden="true" className="size-5" /></span></div>;
}
