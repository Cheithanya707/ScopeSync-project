"use client";

import { TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES } from "@/lib/constants/tasks";
import type { TaskPriority, TaskStatus, TaskType } from "@/types";
import type { RequirementOption } from "./TaskRequirementSelector";

export interface TaskFilterValues {
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  type: TaskType | "all";
  requirement: string;
  assignee: "all" | "unassigned" | "current";
  sort: "updated" | "newest" | "oldest" | "due" | "priority" | "alphabetical";
}

export function TaskFilters({
  value,
  onChange,
  requirements,
  showAssignee = true,
}: {
  value: TaskFilterValues;
  onChange: (value: TaskFilterValues) => void;
  requirements: RequirementOption[];
  showAssignee?: boolean;
}) {
  const selectClass = "h-10 min-w-0 rounded-lg border border-input bg-white px-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:flex-wrap">
      <label className="sr-only" htmlFor="task-filter-status">Filter by status</label>
      <select id="task-filter-status" value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value as TaskFilterValues["status"] })} className={selectClass}>
        <option value="all">All statuses</option>{TASK_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <label className="sr-only" htmlFor="task-filter-priority">Filter by priority</label>
      <select id="task-filter-priority" value={value.priority} onChange={(event) => onChange({ ...value, priority: event.target.value as TaskFilterValues["priority"] })} className={selectClass}>
        <option value="all">All priorities</option>{TASK_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <label className="sr-only" htmlFor="task-filter-type">Filter by type</label>
      <select id="task-filter-type" value={value.type} onChange={(event) => onChange({ ...value, type: event.target.value as TaskFilterValues["type"] })} className={selectClass}>
        <option value="all">All types</option>{TASK_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <label className="sr-only" htmlFor="task-filter-requirement">Filter by requirement</label>
      <select id="task-filter-requirement" value={value.requirement} onChange={(event) => onChange({ ...value, requirement: event.target.value })} className={selectClass}>
        <option value="all">All requirements</option><option value="unlinked">Unlinked</option>
        {requirements.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.title}</option>)}
      </select>
      {showAssignee && <>
        <label className="sr-only" htmlFor="task-filter-assignee">Filter by assignee</label>
        <select id="task-filter-assignee" value={value.assignee} onChange={(event) => onChange({ ...value, assignee: event.target.value as TaskFilterValues["assignee"] })} className={selectClass}>
          <option value="all">All assignees</option><option value="unassigned">Unassigned</option><option value="current">Assigned to me</option>
        </select>
      </>}
      <label className="sr-only" htmlFor="task-sort">Sort tasks</label>
      <select id="task-sort" value={value.sort} onChange={(event) => onChange({ ...value, sort: event.target.value as TaskFilterValues["sort"] })} className={selectClass}>
        <option value="updated">Recently Updated</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="due">Due Date</option><option value="priority">Priority</option><option value="alphabetical">Alphabetical</option>
      </select>
    </div>
  );
}
