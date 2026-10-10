"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskFilters, type TaskFilterValues } from "@/components/tasks/TaskFilters";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskSearch } from "@/components/tasks/TaskSearch";
import { TaskStats } from "@/components/tasks/TaskStats";
import { DeleteTaskDialog } from "@/components/tasks/DeleteTaskDialog";
import { compareTaskPriority } from "@/lib/tasks";
import { deleteTask, getTasks, updateTaskStatus } from "@/services/tasks/taskStore";
import { getRequirements } from "@/services/requirements/requirementStore";
import { getWorkspaceMembers } from "@/services/people/memberStore";
import type { Project, Requirement, Task, WorkspaceMember } from "@/types";

const initialFilters: TaskFilterValues = {
  status: "all", priority: "all", type: "all", requirement: "all", assignee: "all", sort: "updated",
};

export function ProjectTasksPage({
  project,
  ownerId,
  currentUserId,
}: {
  project: Project;
  ownerId: string;
  currentUserId: string;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      setTasks(await getTasks(ownerId, project));
    } catch {
      setError("Unable to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let current = true;
    void Promise.all([getTasks(ownerId, project), getWorkspaceMembers(ownerId, project.workspaceId)]).then(([items, people]) => {
      if (!current) return;
      setTasks(items);
      setMembers(people);
    }).catch(() => {
      if (current) setError("Unable to load tasks. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [ownerId, project]);

  useEffect(() => {
    let current = true;
    void getRequirements(ownerId, project).then((items) => {
      if (current) setRequirements(items.filter((item) => item.status !== "archived"));
    }).catch(() => {
      if (current) setError("Unable to load project requirements. Task records are still available.");
    });
    return () => { current = false; };
  }, [ownerId, project]);

  const filteredTasks = useMemo(() => {
    const term = query.trim().toLowerCase();
    const result = tasks.filter((task) => {
      const matchesQuery = !term || `${task.id} ${task.title} ${task.description ?? ""}`.toLowerCase().includes(term);
      const matchesStatus = filters.status === "all" || task.status === filters.status;
      const matchesPriority = filters.priority === "all" || task.priority === filters.priority;
      const matchesType = filters.type === "all" || task.type === filters.type;
      const matchesRequirement = filters.requirement === "all" ||
        (filters.requirement === "unlinked" ? !task.requirementId : task.requirementId === filters.requirement);
      const matchesAssignee = filters.assignee === "all" ||
        (filters.assignee === "unassigned" ? !task.assigneeId : task.assigneeId === currentUserId || members.some((member) => member.userId === currentUserId && (member.id === task.assigneeId || member.userId === task.assigneeId)));
      return matchesQuery && matchesStatus && matchesPriority && matchesType && matchesRequirement && matchesAssignee;
    });
    return result.sort((a, b) => {
      switch (filters.sort) {
        case "newest": return b.createdAt.localeCompare(a.createdAt);
        case "oldest": return a.createdAt.localeCompare(b.createdAt);
        case "due": return (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31");
        case "priority": return compareTaskPriority(a, b);
        case "alphabetical": return a.title.localeCompare(b.title);
        default: return b.updatedAt.localeCompare(a.updatedAt);
      }
    });
  }, [tasks, query, filters, currentUserId, members]);

  const changeStatus = async (task: Task, status: Task["status"]) => {
    setError("");
    try {
      await updateTaskStatus(ownerId, project, task.id, status);
      await reload();
      setFeedback(status === "completed" ? `${task.id} marked complete.` : `${task.id} status updated.`);
    } catch {
      setError("Unable to update task status. Please try again.");
    }
  };

  const remove = async () => {
    if (!deletingTask) return;
    setDeleting(true);
    try {
      await deleteTask(ownerId, project, deletingTask.id);
      setDeletingTask(null);
      setFeedback("Task deleted.");
      await reload();
    } catch {
      setError("Unable to delete the task. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const requirementLabel = (task: Task) => {
    const requirement = requirements.find((item) => item.id === task.requirementId);
    return requirement ? `${requirement.code} — ${requirement.title}` : task.requirementId ? "Requirement unavailable" : "Not linked";
  };
  const assigneeLabel = (task: Task) => {
    if (!task.assigneeId) return "Unassigned";
    const member = members.find((person) => person.id === task.assigneeId || person.userId === task.assigneeId);
    return member ? `${member.displayName}${member.userId === currentUserId ? " (You)" : ""}` : task.assigneeId === currentUserId ? "You" : "Person not in workspace";
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium text-brand">{project.name}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Tasks</h1><p className="mt-2 text-sm text-muted-foreground">Organize the work required to deliver this project.</p></div>
        <Button asChild><Link href={`/projects/${project.id}/tasks/new`}><Plus aria-hidden={true} />Add Task</Link></Button>
      </div>
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {feedback && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{feedback}</p>}
      <div className="mt-6"><TaskStats tasks={tasks} /></div>
      <section aria-label="Search and filter tasks" className="mt-6 rounded-xl border border-border bg-white p-4">
        <div className="flex flex-col gap-3 xl:flex-row">
          <TaskSearch value={query} onChange={setQuery} />
          <TaskFilters value={filters} onChange={setFilters} requirements={requirements.map(({ id, code, title }) => ({ id, code, title }))} />
        </div>
      </section>
      {loading ? (
        <div role="status" className="mt-6 rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading tasks…</div>
      ) : filteredTasks.length ? (
        <div className="mt-6"><TaskList tasks={filteredTasks} projectId={project.id} requirementLabel={requirementLabel} assigneeLabel={assigneeLabel} onStatusChange={changeStatus} onDelete={setDeletingTask} /></div>
      ) : tasks.length ? (
        <div className="mt-6 rounded-xl border border-border bg-white px-6 py-12 text-center"><h2 className="font-semibold text-slate-950">No tasks found</h2><p className="mt-2 text-sm text-muted-foreground">Try adjusting the search or filters.</p></div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-blue-50 text-brand"><ClipboardList aria-hidden={true} className="size-6" /></span>
          <h2 className="mt-4 text-lg font-semibold text-slate-950">No tasks yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Create tasks to organize the work required to complete this project.</p>
          <Button asChild className="mt-5"><Link href={`/projects/${project.id}/tasks/new`}><Plus aria-hidden={true} />Add Task</Link></Button>
        </div>
      )}
      <DeleteTaskDialog open={Boolean(deletingTask)} loading={deleting} onCancel={() => setDeletingTask(null)} onConfirm={() => void remove()} />
    </div>
  );
}
