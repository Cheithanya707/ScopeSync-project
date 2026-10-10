import type { Project, ProjectStatus } from "@/types";
import { emitActivityEvent } from "@/lib/activityEvents";
import { requestLocalData, resolveWorkspaceId } from "@/lib/localData";

export async function getProjects(ownerId: string, workspaceId: string | null | undefined): Promise<Project[]> {
  const resolvedWorkspaceId = await resolveWorkspaceId(ownerId, workspaceId);
  if (!resolvedWorkspaceId) return [];
  return requestLocalData<Project[]>(
    `/api/v1/projects?workspaceId=${encodeURIComponent(resolvedWorkspaceId)}`,
  );
}

export async function getProject(
  ownerId: string,
  workspaceId: string | null | undefined,
  projectId: string,
): Promise<Project | null> {
  void ownerId;
  void workspaceId;
  try {
    return await requestLocalData<Project>(`/api/v1/projects/${encodeURIComponent(projectId)}`);
  } catch (error) {
    if (error instanceof Error && error.message === "Project not found.") return null;
    throw error;
  }
}

export async function createProject(
  input: Omit<Project, "id" | "createdAt" | "updatedAt">,
): Promise<Project> {
  const workspaceId = await resolveWorkspaceId(input.ownerId, input.workspaceId);
  const project = await requestLocalData<Project>("/api/v1/projects", {
    method: "POST",
    body: JSON.stringify({
      workspaceId,
      ownerId: input.ownerId,
      name: input.name,
      description: input.description,
      type: input.type,
      projectKind: input.projectKind,
      projectCategory: input.projectCategory,
      projectSubcategory: input.projectSubcategory,
      planningBrief: input.planningBrief,
      aiPlan: input.aiPlan,
      clientName: input.clientName,
      startDate: input.startDate,
      deadline: input.deadline,
      budget: input.budget,
      currency: input.currency,
      status: input.status,
    }),
  });
  await emitActivityEvent({
    ownerId: input.ownerId,
    projectId: project.id,
    entityType: "project",
    entityId: project.id,
    entityName: project.name,
    action: "created",
    description: `Created project "${project.name}".`,
  });
  return project;
}

export async function updateProject(
  ownerId: string,
  workspaceId: string,
  projectId: string,
  updates: Partial<Pick<Project, "name" | "description" | "type" | "clientName" | "startDate" | "deadline" | "budget" | "currency">>,
): Promise<Project> {
  const project = await requestLocalData<Project>(`/api/v1/projects/${encodeURIComponent(projectId)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  await emitActivityEvent({
    ownerId,
    projectId,
    entityType: "project",
    entityId: project.id,
    entityName: project.name,
    action: "updated",
    description: `Updated project "${project.name}".`,
  });
  return project;
}

export async function updateProjectStatus(
  ownerId: string,
  workspaceId: string,
  projectId: string,
  status: ProjectStatus,
): Promise<Project> {
  const project = await requestLocalData<Project>(`/api/v1/projects/${encodeURIComponent(projectId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  await emitActivityEvent({
    ownerId,
    projectId,
    entityType: "project",
    entityId: project.id,
    entityName: project.name,
    action: "status_changed",
    description: `Changed project "${project.name}" status to ${status.replace("_", " ")}.`,
    metadata: { status, projectName: project.name },
  });
  return project;
}

export async function deleteProject(ownerId: string, workspaceId: string, projectId: string): Promise<void> {
  const project = await getProject(ownerId, workspaceId, projectId);
  if (!project) throw new Error("This project could not be found in the current workspace.");
  await requestLocalData<{ deleted: boolean }>(`/api/v1/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" });
  await emitActivityEvent({
    ownerId,
    projectId,
    entityType: "project",
    entityId: project.id,
    entityName: project.name,
    action: "deleted",
    description: `Archived project "${project.name}".`,
  });
}
