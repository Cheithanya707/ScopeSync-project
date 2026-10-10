"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, UserRound, UserRoundCheck, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemberAvatar } from "@/components/people/MemberAvatar";
import { MEMBER_ROLES, MEMBER_STATUSES, memberRoleLabel, memberStatusLabel } from "@/lib/constants/people";
import { getProjectsWithTeams, getWorkspaceMembers } from "@/services/people/memberStore";
import type { WorkspaceMember, WorkspaceMemberRole, WorkspaceMemberStatus } from "@/types";

function dateLabel(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function PeopleDirectory({ ownerId, workspaceId }: { ownerId: string; workspaceId: string }) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [projectsWithTeams, setProjectsWithTeams] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<WorkspaceMemberRole | "all">("all");
  const [status, setStatus] = useState<WorkspaceMemberStatus | "all">("all");

  useEffect(() => {
    let current = true;
    void Promise.all([getWorkspaceMembers(ownerId, workspaceId), getProjectsWithTeams(ownerId, workspaceId)])
      .then(([people, projects]) => {
        if (!current) return;
        setMembers(people);
        setProjectsWithTeams(projects.length);
      }).catch(() => {
        if (current) setError("Unable to load workspace people. Please try again.");
      }).finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [ownerId, workspaceId]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return members.filter((member) => {
      const matchesQuery = !term || `${member.displayName} ${member.email} ${memberRoleLabel(member.role)}`.toLowerCase().includes(term);
      return matchesQuery && (role === "all" || member.role === role) && (status === "all" || member.status === status);
    });
  }, [members, query, role, status]);

  const activeCount = members.filter((member) => member.status === "active").length;
  const invitedCount = members.filter((member) => member.status === "invited").length;
  const stats = [
    { label: "Total People", value: members.length, icon: UserRound },
    { label: "Active", value: activeCount, icon: UserRoundCheck },
    { label: "Invited", value: invitedCount, icon: UserRoundPlus },
    { label: "Projects With Teams", value: projectsWithTeams, icon: BriefcaseBusiness },
  ];

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium text-brand">Workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">People</h1><p className="mt-2 text-sm text-muted-foreground">Manage the people involved in your workspace and projects.</p></div>
        <Button asChild><Link href="/people/new"><UserRoundPlus aria-hidden="true" />Add Person</Link></Button>
      </div>
      <section aria-label="People summary" className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-xl border border-border bg-white p-4 sm:p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-brand"><Icon aria-hidden="true" className="size-4" /></span></div><p className="mt-3 text-2xl font-semibold text-slate-950">{loading ? "…" : error ? "—" : value}</p></article>)}
      </section>
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <section aria-label="Search and filter people" className="mt-6 grid gap-3 rounded-xl border border-border bg-white p-4 md:grid-cols-[minmax(0,1fr)_220px_180px]">
        <Input aria-label="Search people" placeholder="Search people by name, email, or role" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select aria-label="Filter by role" value={role} onChange={(event) => setRole(event.target.value as WorkspaceMemberRole | "all")} className="h-11 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><option value="all">All roles</option>{MEMBER_ROLES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value as WorkspaceMemberStatus | "all")} className="h-11 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><option value="all">All statuses</option>{MEMBER_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
      </section>
      {loading ? (
        <div role="status" className="mt-6 animate-pulse rounded-xl border border-border bg-white p-5"><span className="sr-only">Loading people…</span><div className="h-5 w-40 rounded bg-slate-100" /><div className="mt-5 space-y-4">{[1, 2, 3].map((row) => <div key={row} className="h-12 rounded bg-slate-50" />)}</div></div>
      ) : error && !members.length ? (
        <div role="status" className="mt-6 rounded-xl border border-border bg-white p-8 text-center text-sm text-slate-700">People could not be loaded. Refresh the page to try again.</div>
      ) : filtered.length ? (
        <>
          <div className="mt-6 grid gap-3 md:hidden">
            {filtered.map((member) => <PersonCard key={member.id} member={member} />)}
          </div>
          <div className="mt-6 hidden overflow-hidden rounded-xl border border-border bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500"><tr>{["Person", "Role", "Status", "Projects", "Joined", "Actions"].map((label) => <th scope="col" key={label} className="px-4 py-3">{label}</th>)}</tr></thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((member) => <tr key={member.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><MemberAvatar name={member.displayName} photoURL={member.photoURL} size="sm" /><div className="min-w-0"><p className="truncate font-medium text-slate-950">{member.displayName}</p><p className="truncate text-xs text-muted-foreground">{member.email}</p></div></div></td>
                    <td className="px-4 py-3 text-slate-700">{memberRoleLabel(member.role)}</td>
                    <td className="px-4 py-3"><StatusBadge status={member.status} /></td>
                    <td className="px-4 py-3 text-slate-700">{member.projectIds.length} {member.projectIds.length === 1 ? "project" : "projects"}</td>
                    <td className="px-4 py-3 text-slate-700">{dateLabel(member.joinedAt)}</td>
                    <td className="px-4 py-3"><Button asChild variant="ghost" size="sm"><Link href={`/people/${encodeURIComponent(member.id)}`}>View <ArrowRight aria-hidden="true" /></Link></Button></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : members.length ? (
        <div className="mt-6 rounded-xl border border-border bg-white p-10 text-center"><h2 className="font-semibold text-slate-950">No people found</h2><p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filters.</p></div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-blue-50 text-brand"><UserRound aria-hidden="true" className="size-6" /></span><h2 className="mt-4 text-lg font-semibold text-slate-950">No people yet</h2><p className="mt-2 text-sm text-muted-foreground">Add people to your workspace to start building project teams.</p><Button asChild className="mt-5"><Link href="/people/new"><UserRoundPlus aria-hidden="true" />Add Person</Link></Button></div>
      )}
    </div>
  );
}

function PersonCard({ member }: { member: WorkspaceMember }) {
  return <Link href={`/people/${encodeURIComponent(member.id)}`} className="rounded-xl border border-border bg-white p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
    <div className="flex items-start gap-3"><MemberAvatar name={member.displayName} photoURL={member.photoURL} /><div className="min-w-0 flex-1"><p className="truncate font-medium text-slate-950">{member.displayName}</p><p className="truncate text-sm text-muted-foreground">{member.email}</p></div><ArrowRight aria-hidden="true" className="size-4 text-slate-400" /></div>
    <div className="mt-4 flex flex-wrap items-center gap-2"><StatusBadge status={member.status} /><span className="text-xs text-slate-600">{memberRoleLabel(member.role)}</span><span className="ml-auto text-xs text-muted-foreground">{member.projectIds.length} projects</span></div>
  </Link>;
}

export function StatusBadge({ status }: { status: WorkspaceMemberStatus }) {
  const style = status === "active" ? "bg-emerald-50 text-emerald-800" : status === "invited" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>{memberStatusLabel(status)}</span>;
}
