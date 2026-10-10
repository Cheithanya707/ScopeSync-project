import { emitActivityEvent } from "@/lib/activityEvents";
import { requestLocalData } from "@/lib/localData";
import { getProjects } from "@/services/projects/projectStore";
import type { Project, Task, TaskFormValues, TaskPriority, TaskStatus } from "@/types";

const validStatuses = new Set<TaskStatus>(["todo", "in_progress", "blocked", "completed", "cancelled"]);
const validPriorities = new Set<TaskPriority>(["low", "medium", "high", "critical"]);

function collectionPath(projectId: string): string {
  return `/api/projects/${encodeURIComponent(projectId)}/tasks`;
}

function recordPath(projectId: string, taskId: string): string {
  return `${collectionPath(projectId)}/${encodeURIComponent(taskId)}`;
}

function assertProject(project: Project, ownerId: string): void {
  if (!project.id || project.ownerId !== ownerId) {
    throw new Error("Project not found in the current workspace.");
  }
}

function normalizedValues(values: TaskFormValues) {
  if (!values.title.trim() || values.title.trim().length > 180) {
    throw new Error("Enter a task title between 1 and 180 characters.");
  }
  if (values.description.length > 3000) throw new Error("Task description must be 3,000 characters or fewer.");
  if (!validStatuses.has(values.status) || !validPriorities.has(values.priority)) {
    throw new Error("Choose valid task status and priority values.");
  }
  return {
    title: values.title.trim(),
    description: values.description.trim() || undefined,
    type: values.type,
    status: values.status,
    priority: values.priority,
    assigneeId: values.assigneeId || undefined,
    requirementId: values.requirementId || undefined,
    dueDate: values.dueDate || undefined,
    estimatedHours: values.estimatedHours ? Number(values.estimatedHours) : undefined,
    actualHours: values.actualHours ? Number(values.actualHours) : undefined,
  };
}

export async function getWorkspaceTasks(ownerId: string, workspaceId: string): Promise<Task[]> {
  const projects = await getProjects(ownerId, workspaceId);
  const tasks = await Promise.all(projects.map((project) => getTasks(ownerId, project)));
  return tasks.flat().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getTasks(ownerId: string, project: Project): Promise<Task[]> {
  assertProject(project, ownerId);
  const records = await requestLocalData<Task[]>(collectionPath(project.id));
  return records.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getTask(ownerId: string, project: Project, taskId: string): Promise<Task | null> {
  assertProject(project, ownerId);
  return (await getTasks(ownerId, project)).find((task) => task.id === taskId) ?? null;
}

export async function searchTasks(ownerId: string, project: Project, searchTerm: string): Promise<Task[]> {
  const tasks = await getTasks(ownerId, project);
  const term = searchTerm.trim().toLocaleLowerCase();
  if (!term) return tasks;
  return tasks.filter((task) =>
    `${task.id} ${task.title} ${task.description ?? ""}`.toLocaleLowerCase().includes(term),
  );
}

export async function createTask(ownerId: string, project: Project, values: TaskFormValues): Promise<Task> {
  assertProject(project, ownerId);
  const task = await requestLocalData<Task>(collectionPath(project.id), {
    method: "POST",
    body: JSON.stringify(normalizedValues(values)),
  });
  await emitActivityEvent({
    ownerId,
    projectId: project.id,
    entityType: "task",
    entityId: task.id,
    entityName: task.title,
    action: "created",
    description: `Created task "${task.title}".`,
    metadata: { projectName: project.name, taskCode: task.id },
  });
  return task;
}

export async function updateTask(
  ownerId: string,
  project: Project,
  taskId: string,
  values: TaskFormValues,
): Promise<Task> {
  assertProject(project, ownerId);
  const previous = await getTask(ownerId, project, taskId);
  if (!previous) throw new Error("Task not found in this project.");
  const task = await requestLocalData<Task>(recordPath(project.id, taskId), {
    method: "PATCH",
    body: JSON.stringify(normalizedValues(values)),
  });
  const action = previous.status === task.status ? "updated" : task.status === "completed" ? "completed" : "status_changed";
  await emitActivityEvent({
    ownerId,
    projectId: project.id,
    entityType: "task",
    entityId: task.id,
    entityName: task.title,
    action,
    description: `Updated task "${task.title}".`,
    metadata: { projectName: project.name, taskCode: task.id, status: task.status },
  });
  return task;
}

export async function updateTaskStatus(
  ownerId: string,
  project: Project,
  taskId: string,
  status: TaskStatus,
): Promise<Task> {
  assertProject(project, ownerId);
  if (!validStatuses.has(status)) throw new Error("Choose a valid task status.");
  const task = await requestLocalData<Task>(recordPath(project.id, taskId), {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  await emitActivityEvent({
    ownerId,
    projectId: project.id,
    entityType: "task",
    entityId: task.id,
    entityName: task.title,
    action: status === "completed" ? "completed" : "status_changed",
    description: `Changed task "${task.title}" to ${status.replace("_", " ")}.`,
    metadata: { projectName: project.name, taskCode: task.id, status },
  });
  return task;
}

export async function deleteTask(ownerId: string, project: Project, taskId: string): Promise<void> {
  assertProject(project, ownerId);
  await requestLocalData<{ deleted: boolean }>(recordPath(project.id, taskId), { method: "DELETE" });
}

export async function removeWorkspaceAssignee(
  ownerId: string,
  workspaceId: string,
  assigneeIds: string[],
): Promise<void> {
  const ids = new Set(assigneeIds);
  const [projects, tasks] = await Promise.all([
    getProjects(ownerId, workspaceId),
    getWorkspaceTasks(ownerId, workspaceId),
  ]);
  const affectedTasks = tasks.filter((task) => task.assigneeId && ids.has(task.assigneeId));
  await Promise.all(affectedTasks.map(async (task) => {
    const project = projects.find((item) => item.id === task.projectId);
    if (!project) throw new Error("Assigned task belongs to a project that is not available in this workspace.");
    await requestLocalData<Task>(recordPath(project.id, task.id), {
      method: "PATCH",
      body: JSON.stringify({ assigneeId: null }),
    });
  }));
}
