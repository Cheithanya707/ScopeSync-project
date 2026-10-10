"use client";

import Link from "next/link";
import { changeCode, changeDate, changeLabel, CHANGE_SOURCES, CHANGE_TYPES } from "@/lib/changes";
import type { ScopeChange } from "@/types";
import { ChangeCard } from "./ChangeCard";
import { ChangePriorityBadge } from "./ChangePriorityBadge";
import { ChangeStatusBadge } from "./ChangeStatusBadge";

export function ChangeList({ changes, projectId }: { changes: ScopeChange[]; projectId: string }) {
  return <>
    <div className="grid gap-3 md:hidden">{changes.map((change) => <ChangeCard key={change.id} change={change} projectId={projectId} />)}</div>
    <div className="hidden overflow-hidden rounded-xl border border-border bg-white md:block"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
      <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500"><tr>{["Change", "Type", "Priority", "Status", "Source", "Affected requirements", "Requested date"].map((item) => <th key={item} scope="col" className="px-4 py-3">{item}</th>)}</tr></thead>
      <tbody className="divide-y divide-border">{changes.map((change) => <tr key={change.id} className="hover:bg-slate-50/70">
        <td className="max-w-[260px] px-4 py-3"><p className="text-xs font-semibold text-slate-500">{changeCode(change)}</p><Link href={`/projects/${projectId}/changes/${change.id}`} className="mt-1 block truncate font-medium text-slate-900 hover:text-brand">{change.title}</Link></td>
        <td className="px-4 py-3">{changeLabel(CHANGE_TYPES, change.type)}</td><td className="px-4 py-3"><ChangePriorityBadge priority={change.priority} /></td><td className="px-4 py-3"><ChangeStatusBadge status={change.status} /></td><td className="px-4 py-3">{changeLabel(CHANGE_SOURCES, change.source)}</td><td className="px-4 py-3">{change.affectedRequirementIds.length || "—"}</td><td className="px-4 py-3">{changeDate(change.requestedDate)}</td>
      </tr>)}</tbody>
    </table></div></div>
  </>;
}
