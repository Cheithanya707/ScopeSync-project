import Link from "next/link";
import { changeCode, changeDate, changeLabel, CHANGE_SOURCES, CHANGE_TYPES } from "@/lib/changes";
import type { Requirement, ScopeChange, Task } from "@/types";
import { ChangePriorityBadge } from "./ChangePriorityBadge";
import { ChangeStatusBadge } from "./ChangeStatusBadge";
import { ChangeImpactPanel } from "./ChangeImpactPanel";

export function ChangeDetail({
  change,
  projectId,
  tasks,
  requirements,
}: {
  change: ScopeChange;
  projectId: string;
  tasks: Task[];
  requirements: Requirement[];
}) {
  const linkedTasks = change.affectedTaskIds
    .map((id) => tasks.find((task) => task.id === id))
    .filter((task): task is Task => Boolean(task));
  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
    <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2"><ChangeStatusBadge status={change.status} /><ChangePriorityBadge priority={change.priority} /></div>
      <h2 className="mt-5 text-lg font-semibold text-slate-950">Requested change</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{change.description || "No description provided."}</p>
      <div className="mt-7 border-t border-border pt-5">
        <h2 className="font-semibold text-slate-950">Affected requirements</h2>
        {change.affectedRequirementIds.length ? <ul className="mt-3 space-y-2">{change.affectedRequirementIds.map((id) => {
          const requirement = requirements.find((item) => item.id === id);
          return <li key={id} className="rounded-lg border border-border p-3 text-sm text-slate-700">{requirement ? <><span className="font-medium">{requirement.code}</span> — {requirement.title}</> : "Requirement record is no longer available."}</li>;
        })}</ul> : <p className="mt-3 text-sm text-muted-foreground">No requirements linked to this change request.</p>}
      </div>
      <div className="mt-7 border-t border-border pt-5">
        <h2 className="font-semibold text-slate-950">Affected tasks</h2>
        {linkedTasks.length ? <ul className="mt-3 space-y-2">{linkedTasks.map((task) => <li key={task.id} className="rounded-lg border border-border p-3"><Link href={`/projects/${projectId}/tasks/${encodeURIComponent(task.id)}`} className="text-sm font-medium text-brand hover:underline">{task.id} — {task.title}</Link></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No tasks linked to this change.</p>}
      </div>
    </section>
    <div className="space-y-6">
    <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-950">Change details</h2>
      <dl className="mt-3 divide-y divide-border">
        {[
          ["Change ID", changeCode(change)],
          ["Type", changeLabel(CHANGE_TYPES, change.type)],
          ["Source", changeLabel(CHANGE_SOURCES, change.source)],
          ["Requested date", changeDate(change.requestedDate)],
          ["Created", changeDate(change.createdAt)],
          ["Last updated", changeDate(change.updatedAt)],
          ["Reviewed", changeDate(change.reviewedAt)],
          ["Approved", changeDate(change.approvedAt)],
          ["Rejected", changeDate(change.rejectedAt)],
          ["Implemented", changeDate(change.implementedAt)],
        ].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium text-slate-800">{value}</dd></div>)}
      </dl>
    </section>
    <ChangeImpactPanel projectId={projectId} change={change} />
    </div>
  </div>;
}
