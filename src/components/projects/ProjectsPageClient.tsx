"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FolderKanban, Plus, Search, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PROJECT_STATUSES } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { getMyProjects, type MyProject } from "@/services/marketplace/marketplaceStore";
import type { ProjectStatus } from "@/types";

export function ProjectsPageClient({ initialQuery }: { initialQuery: string }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<MyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<ProjectStatus | "all">("all");

  useEffect(() => {
    if (!user) return;
    let current = true;
    void getMyProjects().then((items) => {
      if (current) setProjects(items);
    }).catch((cause) => {
      if (current) setError(cause instanceof Error ? cause.message : "Your projects could not be loaded.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [user]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return projects.filter((project) => {
      const statusMatches = status === "all" || project.status === status;
      const textMatches = !term || `${project.name} ${project.clientName ?? ""} ${project.type} ${project.projectCategory ?? ""}`.toLowerCase().includes(term);
      return statusMatches && textMatches;
    });
  }, [projects, query, status]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">Your work</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">My Projects</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Projects you own, have been assigned to, or joined as an accepted collaborator.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href="/projects/upload"><Plus aria-hidden="true" />Upload opportunity</Link></Button>
          <Button asChild><Link href="/projects/new"><Plus aria-hidden="true" />Create workspace project</Link></Button>
        </div>
      </div>

      <section aria-label="Search and filter projects" className="mt-7 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search projects" placeholder="Search by project or client" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" />
        </div>
        <label className="sr-only" htmlFor="project-status-filter">Filter by status</label>
        <select id="project-status-filter" value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus | "all")} className="h-11 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="all">All statuses</option>
          {PROJECT_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </section>

      {loading ? (
        <div role="status" className="mt-10 rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading projects…</div>
      ) : error ? (
        <div role="alert" className="mt-10 rounded-xl border border-brand/25 bg-brand/10 p-6 text-sm">{error}</div>
      ) : filtered.length ? (
        <section aria-label="Projects you are involved in" className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="group rounded-xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand"><FolderKanban aria-hidden="true" className="size-5" /></span>
                <span className="rounded-full border border-border px-2.5 py-1 text-xs capitalize">{project.status.replaceAll("_", " ")}</span>
              </div>
              <h2 className="mt-4 line-clamp-1 font-semibold text-slate-950 group-hover:text-brand">{project.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{project.projectCategory || project.type.replaceAll("-", " ")}</p>
              <p className="mt-3 text-xs text-muted-foreground">Your role: {project.memberRole === "owner" ? "Owner" : project.memberRole.replaceAll("_", " ")}</p>
              <div className="mt-4" aria-label={`${project.progress}% complete`}>
                <div className="flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{project.progress}%</span></div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-foreground transition-all" style={{ width: `${project.progress}%` }} /></div>
              </div>
              <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><UsersRound aria-hidden="true" className="size-3.5" />{project.teamSize} team members</span>
                <span>{project.deadline || "No deadline"}</span>
                {project.budget !== undefined && <span>{new Intl.NumberFormat(undefined, { style: "currency", currency: project.currency, maximumFractionDigits: 0 }).format(project.budget)}</span>}
                <span>{project.updatedAt ? `Updated ${new Date(project.updatedAt).toLocaleDateString()}` : "Recently updated"}</span>
              </div>
            </Link>
          ))}
        </section>
      ) : projects.length ? (
        <div className="mt-10 rounded-xl border border-border bg-card px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-slate-950">No matching projects</h2>
          <p className="mt-2 text-sm text-muted-foreground">Try changing your search or status filter.</p>
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand"><FolderKanban aria-hidden="true" className="size-6" /></span>
          <h2 className="mt-4 text-lg font-semibold text-slate-950">No active project relationships yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Create a workspace project, or find an opportunity and apply. Accepted collaborations will appear here automatically.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild variant="outline"><Link href="/projects/find">Find Projects</Link></Button>
            <Button asChild><Link href="/projects/new"><Plus aria-hidden="true" />Create workspace project</Link></Button>
          </div>
        </div>
      )}
    </div>
  );
}
