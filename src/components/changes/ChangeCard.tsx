"use client";

import Link from "next/link";
import { changeCode, changeDate, changeLabel, CHANGE_SOURCES, CHANGE_TYPES } from "@/lib/changes";
import type { ScopeChange } from "@/types";
import { ChangePriorityBadge } from "./ChangePriorityBadge";
import { ChangeStatusBadge } from "./ChangeStatusBadge";
import { relativeDateLabel } from "@/lib/dates";

export function ChangeCard({ change, projectId }: { change: ScopeChange; projectId: string }) {
  return <article className="rounded-xl border border-border bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold tracking-wide text-slate-500">{changeCode(change)}</p><Link href={`/projects/${projectId}/changes/${change.id}`} className="mt-1 block break-words font-semibold text-slate-950 hover:text-brand">{change.title}</Link></div><ChangeStatusBadge status={change.status} /></div>
    <div className="mt-3 flex flex-wrap gap-2"><ChangePriorityBadge priority={change.priority} /><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{changeLabel(CHANGE_TYPES, change.type)}</span></div>
    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">Source</dt><dd className="mt-1">{changeLabel(CHANGE_SOURCES, change.source)}</dd></div><div><dt className="text-xs text-muted-foreground">Requested</dt><dd className="mt-1">{change.requestedDate ? relativeDateLabel(change.requestedDate).label : changeDate(change.requestedDate)}</dd></div><div className="col-span-2"><dt className="text-xs text-muted-foreground">Affected requirements</dt><dd className="mt-1">{change.affectedRequirementIds.length}</dd></div></dl>
    <div className="mt-4 border-t border-border pt-3"><Link href={`/projects/${projectId}/changes/${change.id}`} className="text-sm font-medium text-brand hover:underline">View change</Link></div>
  </article>;
}
