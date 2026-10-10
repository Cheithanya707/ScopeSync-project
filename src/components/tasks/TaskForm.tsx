"use client";

import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TASK_PRIORITIES } from "@/lib/constants/tasks";
import type { TaskFormErrors } from "@/lib/taskValidation";
import type { TaskFormValues, WorkspaceMember } from "@/types";
import { TaskAssigneeSelector } from "./TaskAssigneeSelector";
import { TaskRequirementSelector, type RequirementOption } from "./TaskRequirementSelector";
import { TaskStatusSelector } from "./TaskStatusSelector";
import { TaskTypeSelector } from "./TaskTypeSelector";

export const emptyTaskForm: TaskFormValues = {
  title: "",
  description: "",
  type: "development",
  priority: "medium",
  status: "todo",
  requirementId: "",
  assigneeId: "",
  dueDate: "",
  estimatedHours: "",
  actualHours: "",
};

const labelClass = "mb-1.5 block text-sm font-medium text-slate-800";

export function TaskForm({
  value,
  onChange,
  projectDeadline,
  currentUserId,
  currentUserLabel,
  members,
  requirements,
  errors = {},
  showStatus = true,
}: {
  value: TaskFormValues;
  onChange: (value: TaskFormValues) => void;
  projectDeadline?: string;
  currentUserId: string;
  currentUserLabel: string;
  members: WorkspaceMember[];
  requirements: RequirementOption[];
  errors?: TaskFormErrors;
  showStatus?: boolean;
}) {
  const set = <K extends keyof TaskFormValues>(key: K, nextValue: TaskFormValues[K]) => onChange({ ...value, [key]: nextValue });
  const visibleErrors = errors;
  const deadlineWarning = Boolean(value.dueDate && projectDeadline && value.dueDate > projectDeadline);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="task-title" className={labelClass}>Task title <span className="text-red-700">*</span></label>
        <Input id="task-title" maxLength={150} value={value.title} onChange={(event) => set("title", event.target.value)} aria-invalid={Boolean(visibleErrors.title)} aria-describedby={visibleErrors.title ? "task-title-error" : undefined} />
        {visibleErrors.title && <p id="task-title-error" role="alert" className="mt-1 text-sm text-red-700">{visibleErrors.title}</p>}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="task-description" className={labelClass}>Description <span className="font-normal text-slate-500">(optional)</span></label>
        <textarea id="task-description" rows={4} maxLength={3000} value={value.description} onChange={(event) => set("description", event.target.value)} aria-invalid={Boolean(visibleErrors.description)} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{visibleErrors.description && <span role="alert" className="text-red-700">{visibleErrors.description}</span>}</span><span>{value.description.length}/3000</span></div>
      </div>
      <div>
        <label htmlFor="task-type" className={labelClass}>Task type <span className="text-red-700">*</span></label>
        <TaskTypeSelector value={value.type} onChange={(next) => set("type", next)} />
      </div>
      <div>
        <label htmlFor="task-priority" className={labelClass}>Priority <span className="text-red-700">*</span></label>
        <select id="task-priority" value={value.priority} onChange={(event) => set("priority", event.target.value as TaskFormValues["priority"])} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          {TASK_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      {showStatus && <div>
        <label htmlFor="task-form-status" className={labelClass}>Status <span className="text-red-700">*</span></label>
        <TaskStatusSelector id="task-form-status" value={value.status} onChange={(next) => set("status", next)} />
      </div>}
      <TaskAssigneeSelector value={value.assigneeId} onChange={(next) => set("assigneeId", next)} currentUserId={currentUserId} currentUserLabel={currentUserLabel} members={members} />
      <div className="sm:col-span-2"><TaskRequirementSelector value={value.requirementId} onChange={(next) => set("requirementId", next)} requirements={requirements} /></div>
      <div>
        <label htmlFor="task-due-date" className={labelClass}>Due date <span className="font-normal text-slate-500">(optional)</span></label>
        <Input id="task-due-date" type="date" value={value.dueDate} onChange={(event) => set("dueDate", event.target.value)} aria-invalid={Boolean(visibleErrors.dueDate)} />
        {visibleErrors.dueDate && <p role="alert" className="mt-1 text-sm text-red-700">{visibleErrors.dueDate}</p>}
        {deadlineWarning && <p role="status" className="mt-2 flex items-start gap-2 text-sm text-amber-800"><AlertTriangle aria-hidden={true} className="mt-0.5 size-4 shrink-0" />This task is scheduled after the project deadline.</p>}
      </div>
      <div className="hidden sm:block" />
      <div>
        <label htmlFor="task-estimated-hours" className={labelClass}>Estimated hours <span className="font-normal text-slate-500">(optional)</span></label>
        <Input id="task-estimated-hours" type="number" min="0" step="any" inputMode="decimal" value={value.estimatedHours} onChange={(event) => set("estimatedHours", event.target.value)} aria-invalid={Boolean(visibleErrors.estimatedHours)} />
        {visibleErrors.estimatedHours && <p role="alert" className="mt-1 text-sm text-red-700">{visibleErrors.estimatedHours}</p>}
      </div>
      <div>
        <label htmlFor="task-actual-hours" className={labelClass}>Actual hours <span className="font-normal text-slate-500">(optional)</span></label>
        <Input id="task-actual-hours" type="number" min="0" step="any" inputMode="decimal" value={value.actualHours} onChange={(event) => set("actualHours", event.target.value)} aria-invalid={Boolean(visibleErrors.actualHours)} />
        {visibleErrors.actualHours && <p role="alert" className="mt-1 text-sm text-red-700">{visibleErrors.actualHours}</p>}
      </div>
    </div>
  );
}
