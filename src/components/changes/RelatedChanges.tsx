import Link from "next/link";
import { getScopeChanges } from "@/services/changes/changeStore";
import type { Project, ScopeChange } from "@/types";
import { changeCode } from "@/lib/changes";
import { ChangeStatusBadge } from "./ChangeStatusBadge";

export async function getRelatedChanges(ownerId: string, project: Project, relatedId: string, field: "affectedRequirementIds" | "affectedTaskIds"): Promise<ScopeChange[]> {
  return (await getScopeChanges(ownerId, project)).filter((change) => change[field].includes(relatedId));
}

export function RelatedChanges({
  changes,
  projectId,
  heading = "Related Changes",
}: {
  changes: ScopeChange[];
  projectId: string;
  heading?: string;
}) {
  return <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
    <h2 className="font-semibold text-slate-950">{heading}</h2>
    {changes.length ? <ul className="mt-3 space-y-2">{changes.map((change) => <li key={change.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"><div className="min-w-0"><p className="text-xs font-semibold text-slate-500">{changeCode(change)}</p><Link href={`/projects/${projectId}/changes/${change.id}`} className="mt-1 block truncate text-sm font-medium text-brand hover:underline">{change.title}</Link></div><ChangeStatusBadge status={change.status} /></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No changes linked to this item.</p>}
  </section>;
}
