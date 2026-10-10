import Link from "next/link";
import { TASK_TYPES } from "@/lib/constants/tasks";
import type { Task } from "@/types";
import { dueDateLabel } from "@/lib/tasks";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { MemberAvatar } from "@/components/people/MemberAvatar";
import { memberRoleLabel } from "@/lib/constants/people";
import type { WorkspaceMember } from "@/types";

function formatTimestamp(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function TaskDetail({
  task,
  projectId,
  projectDeadline,
  requirementLabel,
  currentUserId,
  assignedMember,
}: {
  task: Task;
  projectId: string;
  projectDeadline?: string;
  requirementLabel: string;
  currentUserId: string;
  assignedMember?: WorkspaceMember | null;
}) {
  const due = dueDateLabel(task.dueDate, task.status);
  const values = [
    ["Type", TASK_TYPES.find((item) => item.value === task.type)?.label ?? "Other"],
    ["Requirement", task.requirementId ? requirementLabel : "Not linked to a requirement"],
    ["Due date", due.label + (due.overdue ? " · Overdue" : "")],
    ["Estimated hours", task.estimatedHours == null ? "Not set" : `${task.estimatedHours}h`],
    ["Actual hours", task.actualHours == null ? "Not set" : `${task.actualHours}h`],
    ["Created", formatTimestamp(task.createdAt)],
    ["Updated", formatTimestamp(task.updatedAt)],
    ["Completed", formatTimestamp(task.completedAt)],
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
      <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2"><TaskStatusBadge status={task.status} /><TaskPriorityBadge priority={task.priority} /></div>
        <h2 className="mt-4 text-lg font-semibold text-slate-950">Description</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{task.description || "No description provided."}</p>
        {task.requirementId && (
          <div className="mt-6 rounded-lg border border-border bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Requirement</p>
            <p className="mt-2 font-medium text-slate-900">{requirementLabel}</p>
            <Link href={`/projects/${projectId}/requirements#${encodeURIComponent(task.requirementId)}`} className="mt-2 inline-flex text-sm font-medium text-brand hover:underline">View requirement</Link>
          </div>
        )}
      </section>
      <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950">Task details</h2>
        <dl className="mt-3 divide-y divide-border">
          <div className="flex items-start justify-between gap-4 border-b border-border py-3 text-sm"><dt className="text-muted-foreground">Assigned To</dt><dd className="max-w-[70%] break-words text-right font-medium text-slate-800">{assignedMember ? <span className="inline-flex items-center gap-2 text-left"><MemberAvatar name={assignedMember.displayName} photoURL={assignedMember.photoURL} size="sm" /><span><span className="block">{assignedMember.displayName}{assignedMember.userId === currentUserId ? " (You)" : ""}</span><span className="block text-xs font-normal text-muted-foreground">{memberRoleLabel(assignedMember.role)}</span></span></span> : task.assigneeId === currentUserId ? "You" : task.assigneeId ? "Person not in workspace" : "Unassigned"}</dd></div>
          {values.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4 py-3 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="max-w-[65%] break-words text-right font-medium text-slate-800">{value}</dd></div>)}
        </dl>
        {projectDeadline && task.dueDate && task.dueDate > projectDeadline && <p className="mt-3 text-sm text-amber-800">This task is scheduled after the project deadline.</p>}
      </section>
    </div>
  );
}
