"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChangeFilters, type ChangeFilterValues } from "@/components/changes/ChangeFilters";
import { ChangeList } from "@/components/changes/ChangeList";
import { ChangeSearch } from "@/components/changes/ChangeSearch";
import { ChangeStats } from "@/components/changes/ChangeStats";
import { CHANGE_PRIORITIES } from "@/lib/constants/changes";
import { getScopeChanges } from "@/services/changes/changeStore";
import type { Project, ScopeChange } from "@/types";
import { ProjectTabs } from "@/components/projects/ProjectTabs";

const defaultFilters: ChangeFilterValues = { status: "all", type: "all", priority: "all", source: "all", sort: "updated" };

export function ProjectChangesPage({ project, ownerId }: { project: Project; ownerId: string }) {
  const [changes, setChanges] = useState<ScopeChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(defaultFilters);

  useEffect(() => {
    let current = true;
    void Promise.resolve().then(() => getScopeChanges(ownerId, project)).then((items) => {
      if (current) setChanges(items);
    }).catch(() => {
      if (current) setError("Unable to load scope changes. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [ownerId, project]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return changes.filter((change) =>
      (!term || `CHANGE-${String(change.changeNumber).padStart(3, "0")} ${change.title} ${change.description ?? ""}`.toLowerCase().includes(term)) &&
      (filters.status === "all" || change.status === filters.status) &&
      (filters.type === "all" || change.type === filters.type) &&
      (filters.priority === "all" || change.priority === filters.priority) &&
      (filters.source === "all" || change.source === filters.source)
    ).sort((a, b) => {
      switch (filters.sort) {
        case "newest": return b.createdAt.localeCompare(a.createdAt);
        case "oldest": return a.createdAt.localeCompare(b.createdAt);
        case "priority": return (CHANGE_PRIORITIES.find((item) => item.value === b.priority)?.rank ?? 0) - (CHANGE_PRIORITIES.find((item) => item.value === a.priority)?.rank ?? 0);
        case "requested": return (b.requestedDate ?? "").localeCompare(a.requestedDate ?? "");
        case "alphabetical": return a.title.localeCompare(b.title);
        default: return b.updatedAt.localeCompare(a.updatedAt);
      }
    });
  }, [changes, query, filters]);

  return <div>
    <ProjectTabs projectId={project.id} active="changes" />
    <div className="mt-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-brand">{project.name}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Changes</h1><p className="mt-2 text-sm text-muted-foreground">Track requests and changes that may affect the agreed project scope.</p></div><Button asChild><Link href={`/projects/${project.id}/changes/new`}><Plus aria-hidden={true} />Add Change Request</Link></Button></div>
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="mt-6"><ChangeStats changes={changes} /></div>
    <section aria-label="Search and filter changes" className="mt-6 rounded-xl border border-border bg-white p-4"><div className="flex flex-col gap-3 xl:flex-row"><ChangeSearch value={query} onChange={setQuery} /><ChangeFilters value={filters} onChange={setFilters} /></div></section>
    {loading ? <div role="status" className="mt-6 rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading changes…</div> : filtered.length ? <div className="mt-6"><ChangeList changes={filtered} projectId={project.id} /></div> : changes.length ? <div className="mt-6 rounded-xl border border-border bg-white p-10 text-center"><h2 className="font-semibold text-slate-950">No changes found</h2><p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filters.</p></div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-blue-50 text-brand"><Shuffle aria-hidden={true} className="size-6" /></span><h2 className="mt-4 text-lg font-semibold text-slate-950">No scope changes yet</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Track new requests and changes so you always know what has changed from the agreed project scope.</p><Button asChild className="mt-5"><Link href={`/projects/${project.id}/changes/new`}><Plus aria-hidden={true} />Add Change Request</Link></Button></div>}
    </div>
  </div>;
}
