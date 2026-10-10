"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardList, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants/tasks";
import { dueDateLabel } from "@/lib/tasks";
import { localDateKey } from "@/lib/dates";
import { getProjects } from "@/services/projects/projectStore";
import { getWorkspaceTasks } from "@/services/tasks/taskStore";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import type { Project, Task, TaskPriority, TaskStatus } from "@/types";

export default function MyTasksPage() {
  const { user } = useAuth();
  const workspace = useWorkspace();
  const ownerId = user?.uid ?? "local-preview-user";
  const activeWorkspaceId = workspace.workspaceId ?? ownerId;
  const currentUserId = user?.uid ?? ownerId;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [priority, setPriority] = useState<TaskPriority | "all">("all");
  const [due, setDue] = useState<"all" | "overdue" | "upcoming">("all");

  useEffect(() => {
    if (!workspace.workspaceId) return;
    let current = true;
    void Promise.all([
      getProjects(ownerId, activeWorkspaceId),
      getWorkspaceTasks(ownerId, activeWorkspaceId),
    ]).then(([projectList, workspaceTasks]) => {
      if (!current) return;
      setProjects(projectList);
      setTasks(workspaceTasks.filter((task) => task.assigneeId === currentUserId));
    }).catch(() => {
      if (current) setError("Unable to load your tasks. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [activeWorkspaceId, currentUserId, ownerId, workspace.workspaceId]);

  const visibleTasks = useMemo(() => workspace.workspaceId ? tasks : [], [tasks, workspace.workspaceId]);
  const visibleProjects = useMemo(() => workspace.workspaceId ? projects : [], [projects, workspace.workspaceId]);
  const projectNames = useMemo(() => new Map(visibleProjects.map((project) => [project.id, project.name])), [visibleProjects]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const todayKey = localDateKey();
    return visibleTasks.filter((task) => {
      const matchesSearch = !term || `${task.title} ${projectNames.get(task.projectId) ?? ""}`.toLowerCase().includes(term);
      const matchesStatus = status === "all" || task.status === status;
      const matchesPriority = priority === "all" || task.priority === priority;
      const matchesDue = due === "all" || (due === "overdue" ? dueDateLabel(task.dueDate, task.status).overdue : Boolean(task.dueDate && task.dueDate >= todayKey));
      return matchesSearch && matchesStatus && matchesPriority && matchesDue;
    });
  }, [visibleTasks, projectNames, query, status, priority, due]);

  return (
    <div>
      <div><p className="text-sm font-medium text-brand">Workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">My Tasks</h1><p className="mt-2 text-sm text-muted-foreground">Tasks assigned to you across your projects.</p></div>
      <section aria-label="Search and filter my tasks" className="mt-7 grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative sm:col-span-2 xl:col-span-1"><Search aria-hidden={true} className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input aria-label="Search tasks and projects" placeholder="Search task or project" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" /></div>
        <label className="sr-only" htmlFor="my-task-status">Status</label><select id="my-task-status" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus | "all")} className="h-11 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><option value="all">All statuses</option>{TASK_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <label className="sr-only" htmlFor="my-task-priority">Priority</label><select id="my-task-priority" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority | "all")} className="h-11 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><option value="all">All priorities</option>{TASK_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <label className="sr-only" htmlFor="my-task-due">Due date</label><select id="my-task-due" value={due} onChange={(event) => setDue(event.target.value as typeof due)} className="h-11 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><option value="all">All due dates</option><option value="overdue">Overdue</option><option value="upcoming">Upcoming / due today</option></select>
      </section>
      {workspace.workspaceId && error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {workspace.workspaceId && loading ? <div role="status" className="mt-6 rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading your tasks…</div> : filtered.length ? (
        <div className="mt-6 grid gap-3">
          {filtered.map((task) => {
            const dueInfo = dueDateLabel(task.dueDate, task.status);
            return <Link key={`${task.projectId}:${task.id}`} href={`/projects/${task.projectId}/tasks/${encodeURIComponent(task.id)}`} className="grid gap-3 rounded-xl border border-border bg-white p-4 transition hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:grid-cols-[minmax(0,1fr)_160px_100px_130px] sm:items-center">
              <div className="min-w-0"><p className="text-xs font-semibold text-slate-500">{task.id}</p><h2 className="mt-1 truncate font-medium text-slate-950">{task.title}</h2><p className="mt-1 truncate text-sm text-muted-foreground">{projectNames.get(task.projectId) ?? "Project"}</p></div>
              <span className="text-sm text-slate-700">{TASK_STATUSES.find((item) => item.value === task.status)?.label}</span>
              <span className="text-sm font-medium capitalize text-slate-700">{task.priority}</span>
              <span className={`inline-flex items-center gap-1 text-sm ${dueInfo.overdue ? "font-medium text-amber-800" : "text-slate-600"}`}><CalendarDays aria-hidden={true} className="size-4" />{dueInfo.label}{dueInfo.overdue ? " · Overdue" : ""}</span>
            </Link>;
          })}
        </div>
      ) : visibleTasks.length ? (
        <div className="mt-6 rounded-xl border border-border bg-white p-10 text-center"><h2 className="font-semibold text-slate-950">No tasks found</h2><p className="mt-2 text-sm text-muted-foreground">Adjust your search or filters.</p></div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-blue-50 text-brand"><ClipboardList aria-hidden={true} className="size-6" /></span><h2 className="mt-4 text-lg font-semibold text-slate-950">No tasks assigned to you</h2><p className="mt-2 text-sm text-muted-foreground">Tasks assigned to your account will appear here.</p></div>
      )}
    </div>
  );
}
