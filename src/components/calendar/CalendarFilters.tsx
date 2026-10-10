"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CALENDAR_CHANGE_STATUSES, CALENDAR_EVENT_TYPES, CALENDAR_TASK_STATUSES } from "@/lib/constants/calendar";
import type { CalendarEventType, ChangeStatus, Project, TaskStatus } from "@/types";

export interface CalendarFilterValues {
  type: CalendarEventType | "all";
  projectId: string;
  taskStatus: TaskStatus | "all";
  changeStatus: ChangeStatus | "all";
  query: string;
}

export function CalendarFilters({
  value,
  onChange,
  projects,
  workspace,
}: {
  value: CalendarFilterValues;
  onChange: (value: CalendarFilterValues) => void;
  projects: Project[];
  workspace: boolean;
}) {
  const update = <K extends keyof CalendarFilterValues>(key: K, next: CalendarFilterValues[K]) => onChange({ ...value, [key]: next });
  const selectClass = "h-10 min-w-0 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";
  return <section aria-label="Search and filter calendar events" className="grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-2 xl:grid-cols-5">
    <div className="relative sm:col-span-2 xl:col-span-1"><Search aria-hidden={true} className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input aria-label="Search calendar events" placeholder="Search events or projects" value={value.query} onChange={(event) => update("query", event.target.value)} className="pl-9" /></div>
    <label className="sr-only" htmlFor="calendar-event-type">Event type</label><select id="calendar-event-type" className={selectClass} value={value.type} onChange={(event) => update("type", event.target.value as CalendarEventType | "all")}><option value="all">All event types</option>{CALENDAR_EVENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
    {workspace && <><label className="sr-only" htmlFor="calendar-project">Project</label><select id="calendar-project" className={selectClass} value={value.projectId} onChange={(event) => update("projectId", event.target.value)}><option value="all">All Projects</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></>}
    <label className="sr-only" htmlFor="calendar-task-status">Task status</label><select id="calendar-task-status" className={selectClass} value={value.taskStatus} onChange={(event) => update("taskStatus", event.target.value as TaskStatus | "all")}><option value="all">All task statuses</option>{CALENDAR_TASK_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
    <label className="sr-only" htmlFor="calendar-change-status">Change status</label><select id="calendar-change-status" className={selectClass} value={value.changeStatus} onChange={(event) => update("changeStatus", event.target.value as ChangeStatus | "all")}><option value="all">All change statuses</option>{CALENDAR_CHANGE_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
  </section>;
}
