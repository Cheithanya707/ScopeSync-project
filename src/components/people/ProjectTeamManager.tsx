"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/people/MemberAvatar";
import { AddTeamMemberDialog } from "@/components/people/AddTeamMemberDialog";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { memberRoleLabel } from "@/lib/constants/people";
import { assignMemberToProject, getProjectMembers, getWorkspaceMembers, removeMemberFromProject } from "@/services/people/memberStore";
import type { Project, WorkspaceMember } from "@/types";

function RemoveTeamMemberDialog({ member, projectName, busy, onCancel, onConfirm }: { member: WorkspaceMember | null; projectName: string; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!member) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }} onKeyDown={(event) => { if (event.key === "Escape" && !busy) onCancel(); }}>
    <section role="alertdialog" aria-modal="true" aria-labelledby="remove-team-member-title" className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl">
      <h2 id="remove-team-member-title" className="text-lg font-semibold text-slate-950">Remove {member.displayName} from this project?</h2>
      <p className="mt-2 text-sm text-muted-foreground">They will remain in the workspace and can be assigned to {projectName} again later.</p>
      <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button><Button type="button" variant="destructive" onClick={onConfirm} disabled={busy}>{busy ? "Removing..." : "Remove"}</Button></div>
    </section>
  </div>;
}

export function ProjectTeamManager({ project, ownerId }: { project: Project; ownerId: string }) {
  const [assigned, setAssigned] = useState<WorkspaceMember[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null);

  const reload = useCallback(async () => {
    const team = await getProjectMembers(ownerId, project.workspaceId, project.id);
    let workspaceMembers: WorkspaceMember[] = [];
    if (project.ownerId === ownerId) {
      workspaceMembers = await getWorkspaceMembers(ownerId, project.workspaceId);
    }
    setAssigned(team);
    setMembers(workspaceMembers);
  }, [ownerId, project.id, project.ownerId, project.workspaceId]);
  useEffect(() => {
    let current = true;
    void Promise.resolve().then(() => reload()).catch(() => {
      if (current) setError("Unable to load this project team. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [reload]);

  const assignSelected = async (memberIds: string[]) => {
    for (const memberId of memberIds) {
      await assignMemberToProject(ownerId, project.workspaceId, memberId, project.id);
    }
    await reload();
    setFeedback("Project team updated.");
  };
  const remove = async (member: WorkspaceMember) => {
    setBusyId(member.id);
    setError("");
    try {
      await removeMemberFromProject(ownerId, project.workspaceId, member.id, project.id);
      setAssigned((current) => current.filter((person) => person.id !== member.id));
      setFeedback(`${member.displayName} was removed from this project.`);
      setMemberToRemove(null);
    } catch {
      setError("Unable to remove this person from the project. Please try again.");
    } finally {
      setBusyId("");
    }
  };

  return <div>
    <div className="mb-6"><ProjectTabs projectId={project.id} active="people" /></div>
    <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden="true" className="size-4" />{project.name}</Link>
    <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-sm font-medium text-brand">{project.name}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Project Team</h1><p className="mt-2 text-sm text-muted-foreground">People assigned to this project.</p></div>
      {project.ownerId === ownerId && <Button type="button" onClick={() => setDialogOpen(true)}><UserRoundPlus aria-hidden="true" />Add Team Member</Button>}
    </div>
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {feedback && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{feedback}</p>}
    {loading ? <div role="status" className="mt-6 animate-pulse rounded-xl border border-border bg-white p-6"><span className="sr-only">Loading project team…</span><div className="h-5 w-40 rounded bg-slate-100" /><div className="mt-5 h-16 rounded bg-slate-50" /></div> : error && !assigned.length ? (
      <div role="status" className="mt-6 rounded-xl border border-border bg-white p-8 text-center text-sm text-slate-700">The project team could not be loaded. Refresh the page to try again.</div>
    ) : assigned.length ? (
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {assigned.map((member) => <article key={member.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-white p-4">
          <MemberAvatar name={member.displayName} photoURL={member.photoURL} />
          <div className="min-w-0 flex-1">{member.email ? <Link href={`/people/${encodeURIComponent(member.id)}`} className="block truncate font-medium text-slate-950 hover:text-brand">{member.displayName}</Link> : <p className="truncate font-medium text-slate-950">{member.displayName}</p>}<p className="mt-1 truncate text-sm text-muted-foreground">{memberRoleLabel(member.role)}</p></div>
          {project.ownerId === ownerId && member.email && <Button type="button" size="sm" variant="outline" onClick={() => setMemberToRemove(member)} disabled={busyId === member.id}>Remove</Button>}
        </article>)}
      </div>
    ) : (
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="font-semibold text-slate-950">No team members assigned</h2><p className="mt-2 text-sm text-muted-foreground">Assign people to this project to start managing the team.</p>{project.ownerId === ownerId && <Button type="button" className="mt-5" onClick={() => setDialogOpen(true)}><UserRoundPlus aria-hidden="true" />Add Team Member</Button>}</div>
    )}
    <AddTeamMemberDialog open={dialogOpen} members={members} assignedIds={assigned.map((member) => member.id)} onCancel={() => setDialogOpen(false)} onAssign={assignSelected} />
    <RemoveTeamMemberDialog member={memberToRemove} projectName={project.name} busy={busyId === memberToRemove?.id} onCancel={() => setMemberToRemove(null)} onConfirm={() => { if (memberToRemove) void remove(memberToRemove); }} />
  </div>;
}

export function ProjectTeamPreview({ project, ownerId }: { project: Project; ownerId: string }) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let current = true;
    void getProjectMembers(ownerId, project.workspaceId, project.id).then((people) => {
      if (current) setMembers(people);
    }).catch(() => {
      if (current) setError(true);
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [ownerId, project.id, project.workspaceId]);
  return <section aria-labelledby="project-team-title" className="mt-8 rounded-xl border border-border bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="project-team-title" className="text-lg font-semibold text-slate-950">Project Team <span className="ml-1 text-sm font-normal text-muted-foreground">{loading ? "" : `(${members.length})`}</span></h2><p className="mt-1 text-sm text-muted-foreground">People assigned to work on this project.</p></div><Button asChild variant="outline"><Link href={`/projects/${project.id}/people`}>Manage Team</Link></Button></div>
    {error ? <p role="alert" className="mt-4 text-sm text-red-700">Unable to load the project team.</p> : loading ? <div role="status" className="mt-4 h-14 animate-pulse rounded-lg bg-slate-50"><span className="sr-only">Loading project team…</span></div> : members.length ? <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{members.slice(0, 6).map((member) => <li key={member.id} className="flex min-w-0 items-center gap-3 rounded-lg border border-border p-3"><MemberAvatar name={member.displayName} photoURL={member.photoURL} size="sm" /><div className="min-w-0"><Link href={`/people/${encodeURIComponent(member.id)}`} className="block truncate text-sm font-medium text-slate-950 hover:text-brand">{member.displayName}</Link><p className="truncate text-xs text-muted-foreground">{memberRoleLabel(member.role)}</p></div></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">No team members assigned yet.</p>}
  </section>;
}
