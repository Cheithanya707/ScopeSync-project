"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Clock3, Pencil, Trash2 } from "lucide-react";
import { TASK_TYPES } from "@/lib/constants/tasks";
import { dueDateLabel } from "@/lib/tasks";
import type { Task } from "@/types";
import { TaskCard } from "./TaskCard";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { TaskStatusSelector } from "./TaskStatusSelector";

export function TaskList({
  tasks,
  projectId,
  requirementLabel,
  assigneeLabel,
  onStatusChange,
  onDelete,
}: {
  tasks: Task[];
  projectId: string;
  requirementLabel: (task: Task) => string;
  assigneeLabel: (task: Task) => string;
  onStatusChange: (task: Task, status: Task["status"]) => Promise<void>;
  onDelete: (task: Task) => void;
}) {
  const [updatingId, setUpdatingId] = useState("");
  const change = async (task: Task, status: Task["status"]) => {
    setUpdatingId(task.id);
    try { await onStatusChange(task, status); } finally { setUpdatingId(""); }
  };
  return (
    <>
      <div className="grid gap-3 md:hidden">
        {tasks.map((task) => <TaskCard key={task.id} task={task} projectId={projectId} requirementLabel={requirementLabel(task)} assigneeLabel={assigneeLabel(task)} onStatusChange={onStatusChange} onDelete={onDelete} />)}
      </div>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>{["Task", "Requirement", "Assignee", "Priority", "Status", "Due date", "Estimate", "Actions"].map((header) => <th key={header} scope="col" className="px-4 py-3">{header}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.map((task) => {
                const due = dueDateLabel(task.dueDate, task.status);
                return (
                  <tr key={task.id} className="hover:bg-slate-50/70">
                    <td className="max-w-[280px] px-4 py-3">
                      <p className="text-xs font-semibold text-slate-500">{task.id}</p>
                      <Link href={`/projects/${projectId}/tasks/${encodeURIComponent(task.id)}`} className="mt-1 block truncate font-medium text-slate-900 hover:text-brand">{task.title}</Link>
                      <span className="mt-1 block text-xs text-muted-foreground">{TASK_TYPES.find((item) => item.value === task.type)?.label}</span>
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-slate-700">{requirementLabel(task)}</td>
                    <td className="px-4 py-3 text-slate-700">{assigneeLabel(task)}</td>
                    <td className="px-4 py-3"><TaskPriorityBadge priority={task.priority} /></td>
                    <td className="px-4 py-3"><TaskStatusSelector value={task.status} onChange={(status) => void change(task, status)} disabled={updatingId === task.id} /></td>
                    <td className={`px-4 py-3 ${due.overdue ? "font-medium text-amber-800" : "text-slate-700"}`}><span className="inline-flex items-center gap-1"><CalendarDays aria-hidden={true} className="size-3.5" />{due.label}</span>{due.overdue && <span className="ml-1.5 rounded bg-amber-50 px-1.5 py-0.5 text-xs">Overdue</span>}</td>
                    <td className="px-4 py-3 text-slate-700"><span className="inline-flex items-center gap-1"><Clock3 aria-hidden={true} className="size-3.5" />{task.estimatedHours == null ? "—" : `${task.estimatedHours}h`}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link aria-label={`View ${task.id}`} href={`/projects/${projectId}/tasks/${encodeURIComponent(task.id)}`} className="text-xs font-medium text-brand hover:underline">View</Link>
                        <Link aria-label={`Edit ${task.id}`} href={`/projects/${projectId}/tasks/${encodeURIComponent(task.id)}/edit`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><Pencil aria-hidden={true} className="size-4" /></Link>
                        <button aria-label={`Delete ${task.id}`} type="button" onClick={() => onDelete(task)} className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-800"><Trash2 aria-hidden={true} className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
