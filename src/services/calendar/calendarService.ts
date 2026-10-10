import { changeCode } from "@/lib/changes";
import { parseDateOnly } from "@/lib/dates";
import type { CalendarEvent, Project, ScopeChange, Task } from "@/types";
import { getScopeChanges } from "@/services/changes/changeStore";
import { getProject, getProjects } from "@/services/projects/projectStore";
import { getTasks, getWorkspaceTasks } from "@/services/tasks/taskStore";
import { getProjectPayments, getWorkspacePayments } from "@/services/payments/paymentStore";
import { formatPaymentNumber } from "@/lib/utils/paymentUtils";
import type { Payment } from "@/types";
import { getScheduleItems } from "@/services/local/eventScheduleService";

function createProjectEvents(project: Project): CalendarEvent[] {
  if (!project.deadline) return [];
  return [{
    id: `project:${project.id}:deadline`,
    title: `${project.name} — Project Deadline`,
    type: "project_deadline",
    date: project.deadline,
    projectId: project.id,
    projectName: project.name,
    sourceId: project.id,
    description: project.description,
    status: project.status,
  }];
}

function createTaskEvents(projects: Project[], tasks: Task[]): CalendarEvent[] {
  const projectsById = new Map(projects.map((project) => [project.id, project]));
  return tasks.flatMap((task) => {
    const project = projectsById.get(task.projectId);
    if (!task.dueDate || !project || task.ownerId !== project.ownerId || task.workspaceId !== project.workspaceId) return [];
    return [{
      id: `task:${project.id}:${task.id}`,
      title: task.title,
      type: "task_due" as const,
      date: task.dueDate,
      projectId: project.id,
      projectName: project.name,
      sourceId: task.id,
      description: task.description,
      status: task.status,
      priority: task.priority,
    }];
  });
}

function createChangeEvents(projects: Project[], changes: ScopeChange[][]): CalendarEvent[] {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  return changes.flatMap((projectChanges) => projectChanges.flatMap((change) => {
    const project = projectById.get(change.projectId);
    if (!change.requestedDate || !project || change.ownerId !== project.ownerId || change.workspaceId !== project.workspaceId) return [];
    return [{
      id: `change:${project.id}:${change.id}`,
      title: `${changeCode(change)} — ${change.title}`,
      type: "change_requested" as const,
      date: change.requestedDate,
      projectId: project.id,
      projectName: project.name,
      sourceId: change.id,
      description: change.description,
      status: change.status,
      priority: change.priority,
    }];
  }));
}

function createPaymentEvents(projects: Project[], payments: Payment[]): CalendarEvent[] {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  return payments.flatMap((payment) => {
    const project = projectById.get(payment.projectId);
    if (!payment.dueDate || payment.status !== "pending" ||
      !project || payment.ownerId !== project.ownerId || payment.workspaceId !== project.workspaceId) return [];
    return [{
      id: `payment:${payment.id}:due`,
      title: `${formatPaymentNumber(payment)} — ${payment.title}`,
      type: "payment_due" as const,
      date: payment.dueDate,
      projectId: project.id,
      projectName: project.name,
      sourceId: payment.id,
      description: payment.description,
      status: payment.status,
    }];
  });
}

async function createEventScheduleEvents(ownerId: string, projects: Project[]): Promise<CalendarEvent[]> {
  const schedules = await Promise.all(projects.map((project) => getScheduleItems(project.id, project.workspaceId, ownerId)));
  const projectById = new Map(projects.map((project) => [project.id, project]));
  return schedules.flatMap((items) => items.flatMap((item) => {
    const project = projectById.get(item.projectId);
    if (!project || item.workspaceId !== project.workspaceId) return [];
    return [{
      id: `event:${project.id}:${item.id}`,
      title: item.title,
      type: "event_schedule" as const,
      date: item.startDateTime.slice(0, 10),
      projectId: project.id,
      projectName: project.name,
      sourceId: item.id,
      description: [item.startDateTime.slice(11, 16), item.location, item.description].filter(Boolean).join(" · "),
    }];
  }));
}

function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return events.filter((event) => parseDateOnly(event.date) !== null).sort((a, b) =>
    a.date.localeCompare(b.date) || a.title.localeCompare(b.title),
  );
}

export async function getWorkspaceCalendarEvents(
  ownerId: string,
  workspaceId: string | null = null,
): Promise<CalendarEvent[]> {
  if (!workspaceId) return [];
  const [projects, tasks] = await Promise.all([
    getProjects(ownerId, workspaceId),
    getWorkspaceTasks(ownerId, workspaceId),
  ]);
  const projectIds = new Set(projects.map((project) => project.id));
  const scopedTasks = tasks.filter((task) => projectIds.has(task.projectId));
  const [changes, payments] = await Promise.all([
    Promise.all(projects.map((project) => getScopeChanges(ownerId, project))),
    getWorkspacePayments(ownerId, workspaceId, projects),
  ]);
  const scheduleEvents = await createEventScheduleEvents(ownerId, projects);
  return sortEvents([
    ...projects.flatMap(createProjectEvents),
    ...createTaskEvents(projects, scopedTasks),
    ...createChangeEvents(projects, changes),
    ...createPaymentEvents(projects, payments),
    ...scheduleEvents,
  ]);
}

export async function getProjectCalendarEvents(
  ownerId: string,
  projectId: string,
  workspaceId: string | null = null,
): Promise<CalendarEvent[]> {
  if (!workspaceId) return [];
  const project = await getProject(ownerId, workspaceId, projectId);
  if (!project) throw new Error("Project not found in the current workspace.");
  const [tasks, changes, payments, scheduleEvents] = await Promise.all([
    getTasks(ownerId, project),
    getScopeChanges(ownerId, project),
    getProjectPayments(ownerId, project),
    createEventScheduleEvents(ownerId, [project]),
  ]);
  return sortEvents([
    ...createProjectEvents(project),
    ...createTaskEvents([project], tasks),
    ...createChangeEvents([project], [changes]),
    ...createPaymentEvents([project], payments),
    ...scheduleEvents,
  ]);
}

export function calendarEventHref(event: CalendarEvent): string {
  if (event.type === "event_schedule") return `/projects/${event.projectId}/event/schedule`;
  if (event.type === "task_due") return `/projects/${event.projectId}/tasks/${encodeURIComponent(event.sourceId)}`;
  if (event.type === "change_requested") return `/projects/${event.projectId}/changes/${encodeURIComponent(event.sourceId)}`;
  if (event.type === "payment_due") return `/projects/${event.projectId}/payments/${encodeURIComponent(event.sourceId)}`;
  return `/projects/${event.projectId}`;
}
