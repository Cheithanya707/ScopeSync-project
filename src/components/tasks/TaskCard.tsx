"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Clock3, Pencil, Trash2 } from "lucide-react";
import { TASK_TYPES } from "@/lib/constants/tasks";
import { dueDateLabel } from "@/lib/tasks";
import type { Task } from "@/types";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { TaskStatusSelector } from "./TaskStatusSelector";

export function TaskCard({
  task,
  projectId,
  requirementLabel,
  assigneeLabel,
  onStatusChange,
  onDelete,
}: {
  task: Task;
  projectId: string;
  requirementLabel: string;
  assigneeLabel: string;
  onStatusChange: (task: Task, status: Task["status"]) => Promise<void>;
  onDelete: (task: Task) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const due = dueDateLabel(task.dueDate, task.status);
  const statusChange = async (status: Task["status"]) => {
    setUpdating(true);
    try { await onStatusChange(task, status); } finally { setUpdating(false); }
  };
  return (
    <article className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-xs font-semibold tracking-wide text-slate-500">{task.id}</p><Link href={`/projects/${projectId}/tasks/${encodeURIComponent(task.id)}`} className="mt-1 block break-words font-semibold text-slate-950 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">{task.title}</Link></div>
        <TaskPriorityBadge priority={task.priority} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2"><TaskStatusBadge status={task.status} /><span className="text-xs text-muted-foreground">{TASK_TYPES.find((item) => item.value === task.type)?.label}</span></div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-xs text-muted-foreground">Requirement</dt><dd className="mt-1 truncate text-slate-800">{requirementLabel}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Assignee</dt><dd className="mt-1 truncate text-slate-800">{assigneeLabel}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Due date</dt><dd className={`mt-1 inline-flex items-center gap-1 ${due.overdue ? "font-medium text-amber-800" : "text-slate-800"}`}><CalendarDays aria-hidden={true} className="size-3.5" />{due.label}{due.overdue && <span className="ml-1 rounded bg-amber-50 px-1.5 py-0.5 text-xs">Overdue</span>}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Estimated effort</dt><dd className="mt-1 inline-flex items-center gap-1 text-slate-800"><Clock3 aria-hidden={true} className="size-3.5" />{task.estimatedHours == null ? "—" : `${task.estimatedHours}h`}</dd></div>
      </dl>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <TaskStatusSelector value={task.status} onChange={(status) => void statusChange(status)} disabled={updating} />
        <div className="flex items-center gap-1">
          <Link aria-label={`View ${task.id}`} href={`/projects/${projectId}/tasks/${encodeURIComponent(task.id)}`} className="rounded-md px-2 py-1.5 text-xs font-medium text-brand hover:bg-blue-50">View</Link>
          <Link aria-label={`Edit ${task.id}`} href={`/projects/${projectId}/tasks/${encodeURIComponent(task.id)}/edit`} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Pencil aria-hidden={true} className="size-4" /></Link>
          <button aria-label={`Delete ${task.id}`} type="button" onClick={() => onDelete(task)} className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-800"><Trash2 aria-hidden={true} className="size-4" /></button>
        </div>
      </div>
    </article>
  );
}
