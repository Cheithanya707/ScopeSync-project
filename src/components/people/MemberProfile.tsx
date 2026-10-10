"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/people/MemberAvatar";
import { AssignProjectDialog } from "@/components/people/AssignProjectDialog";
import { RemoveMemberDialog } from "@/components/people/RemoveMemberDialog";
import { MEMBER_ROLES, memberRoleLabel, memberStatusLabel } from "@/lib/constants/people";
import { deleteWorkspaceMember, assignMemberToProject, getWorkspaceMember, removeMemberFromProject } from "@/services/people/memberStore";
import { getProjects } from "@/services/projects/projectStore";
import type { Project, WorkspaceMember } from "@/types";

function RemoveProjectDialog({ name, projectName, busy, onCancel, onConfirm }: { name: string; projectName: string; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="remove-project-title" className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl"><h2 id="remove-project-title" className="text-lg font-semibold text-slate-950">Remove from project?</h2><p className="mt-2 text-sm text-muted-foreground">Remove {name} from {projectName}? They will remain in the workspace.</p><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button><Button type="button" variant="destructive" onClick={onConfirm} disabled={busy}>{busy ? "Removing..." : "Remove"}</Button></div></section></div>;
}

function joinedDateLabel(value?: string) {
  if (!value) return "Not joined yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function MemberProfile({ ownerId, workspaceId, memberId }: { ownerId: string; workspaceId: string; memberId: string }) {
  const router = useRouter();
  const [member, setMember] = useState<WorkspaceMember | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [removeWorkspace, setRemoveWorkspace] = useState(false);
  const [removeProject, setRemoveProject] = useState<Project | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let current = true;
    void Promise.resolve().then(() => Promise.all([
      getWorkspaceMember(ownerId, workspaceId, memberId),
      getProjects(ownerId, workspaceId),
    ])).then(([person, projectList]) => {
      if (!current) return;
      setMember(person);
      setProjects(projectList);
    }).catch(() => {
      if (current) setError("Unable to load this person. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [ownerId, workspaceId, memberId]);

  const assign = async (projectId: string) => {
    if (!member) return;
    const updated = await assignMemberToProject(ownerId, workspaceId, member.id, projectId);
    setMember(updated);
    setFeedback("Project assigned.");
  };
  const confirmRemoveProject = async () => {
    if (!member || !removeProject) return;
    setBusy(true);
    setError("");
    try {
      setMember(await removeMemberFromProject(ownerId, workspaceId, member.id, removeProject.id));
      setFeedback("Person removed from the project.");
      setRemoveProject(null);
    } catch {
      setError("Unable to remove this person from the project. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const confirmRemoveMember = async () => {
    if (!member) return;
    setBusy(true);
    setError("");
    try {
      await deleteWorkspaceMember(ownerId, workspaceId, member.id);
      router.replace("/people");
    } catch {
      setError("Unable to remove this person from the workspace. Please try again.");
      setBusy(false);
      setRemoveWorkspace(false);
    }
  };

  if (loading) return <div role="status" className="animate-pulse rounded-xl border border-border bg-white p-8"><span className="sr-only">Loading member profile…</span><div className="h-5 w-40 rounded bg-slate-100" /><div className="mt-5 h-24 rounded bg-slate-50" /></div>;
  if (!member) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold text-slate-950">{error ? "Person unavailable" : "Person not found"}</h1><p className="mt-2 text-sm text-muted-foreground">{error || "This person is not available in this workspace."}</p><Button asChild variant="outline" className="mt-5"><Link href="/people">Back to people</Link></Button></section>;

  const assignedProjects = projects.filter((project) => member.projectIds.includes(project.id));
  return <div>
    <Link href="/people" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden="true" className="size-4" />Back to people</Link>
    <header className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4"><MemberAvatar name={member.displayName} photoURL={member.photoURL} size="lg" /><div><p className="text-sm font-medium text-brand">Member Profile</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{member.displayName}</h1><p className="mt-1 text-sm text-muted-foreground">{memberRoleLabel(member.role)}</p></div></div>
      <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href={`/people/${encodeURIComponent(member.id)}/edit`}><Pencil aria-hidden="true" />Edit</Link></Button><Button type="button" variant="destructive" onClick={() => setRemoveWorkspace(true)}><Trash2 aria-hidden="true" />Remove from Workspace</Button></div>
    </header>
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {feedback && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{feedback}</p>}
    <section aria-labelledby="member-info-title" className="mt-7 rounded-xl border border-border bg-white p-5 sm:p-6">
      <h2 id="member-info-title" className="text-lg font-semibold text-slate-950">Member Information</h2>
      <dl className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div><dt className="text-xs text-muted-foreground">Email</dt><dd className="mt-1 flex items-center gap-2 break-all text-sm font-medium text-slate-800"><Mail aria-hidden="true" className="size-4 shrink-0 text-slate-400" />{member.email}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Role</dt><dd className="mt-1 text-sm font-medium text-slate-800">{MEMBER_ROLES.find((role) => role.value === member.role)?.label}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-1 text-sm font-medium text-slate-800">{memberStatusLabel(member.status)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Joined date</dt><dd className="mt-1 text-sm font-medium text-slate-800">{joinedDateLabel(member.joinedAt)}</dd></div>
      </dl>
    </section>
    <section aria-labelledby="assigned-projects-title" className="mt-6 rounded-xl border border-border bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="assigned-projects-title" className="text-lg font-semibold text-slate-950">Assigned Projects</h2><p className="mt-1 text-sm text-muted-foreground">Projects where this person is part of the team.</p></div><Button type="button" onClick={() => setAssignOpen(true)}><Plus aria-hidden="true" />Assign to Project</Button></div>
      {assignedProjects.length ? <ul className="mt-4 grid gap-3 md:grid-cols-2">{assignedProjects.map((project) => <li key={project.id} className="flex min-w-0 items-center gap-3 rounded-lg border border-border p-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand"><BriefcaseBusiness aria-hidden="true" className="size-5" /></span><div className="min-w-0 flex-1"><Link href={`/projects/${project.id}`} className="block truncate font-medium text-slate-950 hover:text-brand">{project.name}</Link><p className="mt-1 text-xs text-muted-foreground">{project.type.replaceAll("-", " ")} · {project.status.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-slate-600">{memberRoleLabel(member.role)}</p></div><Button type="button" size="sm" variant="outline" onClick={() => setRemoveProject(project)}>Remove</Button></li>)}</ul> : <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-muted-foreground">This person has not been assigned to a project.</p>}
    </section>
    <AssignProjectDialog open={assignOpen} projects={projects} assignedIds={member.projectIds} onCancel={() => setAssignOpen(false)} onAssign={assign} />
    <RemoveMemberDialog open={removeWorkspace} name={member.displayName} busy={busy} onCancel={() => setRemoveWorkspace(false)} onConfirm={() => void confirmRemoveMember()} />
    {removeProject && <RemoveProjectDialog name={member.displayName} projectName={removeProject.name} busy={busy} onCancel={() => setRemoveProject(null)} onConfirm={() => void confirmRemoveProject()} />}
  </div>;
}
