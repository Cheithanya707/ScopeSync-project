"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, CircleDollarSign, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecentActivity } from "@/components/activity/RecentActivity";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import { ProjectOverviewHeader } from "@/components/projects/ProjectOverviewHeader";
import { ProjectOverviewStats } from "@/components/projects/ProjectOverviewStats";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { ProjectUpcomingDates } from "@/components/calendar/ProjectUpcomingDates";
import { ProjectTeamPreview } from "@/components/people/ProjectTeamManager";
import { ProjectPlanPreview } from "@/components/projects/ProjectPlanPreview";
import { getProject, deleteProject, updateProjectStatus } from "@/services/projects/projectStore";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import type { Project, ProjectStatus } from "@/types";
import { deadlineDateLabel, formatDateOnly } from "@/lib/dates";
import { EVENT_PROJECT_TYPES } from "@/lib/constants/events";
import { getProjectShares } from "@/services/local/projectShareService";

function dateLabel(value?: string) {
  return value ? formatDateOnly(value, { dateStyle: "long" }) : "Not set";
}

export default function ProjectOverviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const workspace = useWorkspace();
  const router = useRouter();
  const ownerId = user?.uid ?? "local-preview-user";
  const activeWorkspaceId = workspace.workspaceId ?? ownerId;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [activeShares, setActiveShares] = useState<number | null>(null);
  const [shareLoadError, setShareLoadError] = useState("");

  useEffect(() => {
    let current = true;
    void Promise.resolve().then(() => getProject(ownerId, activeWorkspaceId, projectId)).then((item) => {
      if (current) setProject(item);
    }).catch(() => {
      if (current) setError("Unable to load this project. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [activeWorkspaceId, ownerId, projectId]);

  useEffect(() => {
    if (!project) return;
    let current = true;
    if (project.ownerId !== ownerId) return;
    void getProjectShares(project.id, project.workspaceId, ownerId).then((shares) => {
      if (current) {
        setActiveShares(shares.filter((share) => share.status === "active").length);
        setShareLoadError("");
      }
    }).catch(() => {
      if (current) {
        setActiveShares(null);
        setShareLoadError("Client access count is unavailable.");
      }
    });
    return () => { current = false; };
  }, [ownerId, project]);

  const changeStatus = async (status: ProjectStatus) => {
    setUpdating(true);
    setError("");
    try {
      const updated = await updateProjectStatus(ownerId, activeWorkspaceId, projectId, status);
      setProject(updated);
    } catch {
      setError("Unable to update the project status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    setError("");
    try {
      await deleteProject(ownerId, activeWorkspaceId, projectId);
      router.replace("/projects");
    } catch {
      setError("Unable to delete this project. Please try again.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading project…</div>;
  if (!project) return (
    <section className="rounded-xl border border-border bg-white p-8 text-center">
      <h1 className="text-xl font-semibold text-slate-950">{error ? "Project unavailable" : "Project not found"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error || "This project may have been removed or belongs to another browser profile."}</p>
      <Button asChild variant="outline" className="mt-5"><Link href="/projects">Back to projects</Link></Button>
    </section>
  );

  return (
    <div>
      <ProjectOverviewHeader project={project} onStatusChange={changeStatus} statusUpdating={updating} canManage={project.ownerId === ownerId} />
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="mt-7"><ProjectTabs projectId={project.id} /></div>
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
        <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-950">Project overview</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{project.description || "No project description has been added."}</p>
          {project.projectCategory && (
            <p className="mt-4 inline-flex rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              {project.projectCategory}{project.projectSubcategory ? ` · ${project.projectSubcategory}` : ""}
            </p>
          )}
          {project.aiPlan && <div className="mt-7 border-t border-border pt-6"><ProjectPlanPreview plan={project.aiPlan} /></div>}
          {project.planningBrief && (
            <details className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
              <summary className="cursor-pointer text-sm font-medium text-foreground">View project intake details</summary>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{project.planningBrief}</p>
            </details>
          )}
          <dl className="mt-6 grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
            <div className="flex gap-3"><CalendarDays aria-hidden="true" className="mt-0.5 size-4 text-slate-400" /><div><dt className="text-xs text-muted-foreground">Start date</dt><dd className="mt-1 text-sm font-medium text-slate-800">{dateLabel(project.startDate)}</dd></div></div>
            <div className="flex gap-3"><CalendarDays aria-hidden="true" className="mt-0.5 size-4 text-slate-400" /><div><dt className="text-xs text-muted-foreground">Deadline</dt><dd className={`mt-1 text-sm font-medium ${project.deadline && deadlineDateLabel(project.deadline) === "Overdue" ? "text-amber-800" : "text-slate-800"}`}>{deadlineDateLabel(project.deadline)}</dd></div></div>
            <div className="flex gap-3"><CircleDollarSign aria-hidden="true" className="mt-0.5 size-4 text-slate-400" /><div><dt className="text-xs text-muted-foreground">Budget</dt><dd className="mt-1 text-sm font-medium text-slate-800">{project.budget == null ? "Not set" : new Intl.NumberFormat(undefined, { style: "currency", currency: project.currency, maximumFractionDigits: 2 }).format(project.budget)}</dd></div></div>
            <div className="flex gap-3"><UserRound aria-hidden="true" className="mt-0.5 size-4 text-slate-400" /><div><dt className="text-xs text-muted-foreground">Client / organization</dt><dd className="mt-1 text-sm font-medium text-slate-800">{project.clientName || "Not set"}</dd></div></div>
          </dl>
        </section>
        <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-950">Project actions</h2>
          <p className="mt-2 text-sm text-muted-foreground">{project.ownerId === ownerId ? "Edit project details or archive this project from the workspace." : "Shared project tools for everyone working on this project."}</p>
          <div className="mt-5 grid gap-3">
            {EVENT_PROJECT_TYPES.has(project.type) && <Button asChild><Link href={`/projects/${project.id}/event`}>Open event management</Link></Button>}
            {project.ownerId === ownerId && <Button asChild variant="outline"><Link href={`/projects/${project.id}/edit`}>Edit project</Link></Button>}
            {project.ownerId === ownerId && <div className="rounded-lg border border-border p-4">
              <h3 className="font-medium text-slate-900">Client Access</h3>
              <p className="mt-1 text-sm text-muted-foreground">{activeShares === null ? shareLoadError || "Loading access…" : `${activeShares} Active ${activeShares === 1 ? "Share" : "Shares"}`}</p>
              <Button asChild variant="outline" className="mt-3 w-full"><Link href={`/projects/${project.id}/sharing`}>Manage Client Access</Link></Button>
            </div>}
            {project.ownerId === ownerId && <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}><Trash2 aria-hidden="true" />Delete project</Button>}
          </div>
        </section>
      </div>
      <div className="mt-8"><ProjectOverviewStats project={project} ownerId={ownerId} /></div>
      <ProjectTeamPreview project={project} ownerId={ownerId} />
      <div className="mt-8"><ProjectUpcomingDates project={project} ownerId={ownerId} /></div>
      <section aria-labelledby="project-recent-activity" className="mt-8 rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div><h2 id="project-recent-activity" className="text-lg font-semibold text-slate-950">Recent Activity</h2><p className="mt-1 text-sm text-muted-foreground">The latest actions for this project.</p></div>
          <Link href={`/activity?projectId=${encodeURIComponent(project.id)}`} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand hover:underline">View all activity <span aria-hidden="true">→</span></Link>
        </div>
        <div className="mt-4"><RecentActivity workspaceId={project.workspaceId} projectId={project.id} limit={10} /></div>
      </section>
      <DeleteProjectDialog open={confirmDelete} loading={deleting} onCancel={() => setConfirmDelete(false)} onConfirm={() => void remove()} />
    </div>
  );
}
