import { emitActivityEvent } from "@/lib/activityEvents";
import { requestLocalData } from "@/lib/localData";
import type {
  Project,
  Requirement,
  RequirementFormValues,
  RequirementStatus,
  RequirementType,
  TaskPriority,
} from "@/types";
import { getProjects } from "@/services/projects/projectStore";

const requirementTypes = new Set<RequirementType>([
  "functional", "non_functional", "technical", "design", "security", "performance", "event", "other",
]);
const requirementStatuses = new Set<RequirementStatus>([
  "draft", "under_review", "approved", "rejected", "archived",
]);
const requirementPriorities = new Set<TaskPriority>(["low", "medium", "high", "critical"]);

function collectionPath(projectId: string): string {
  return `/api/projects/${encodeURIComponent(projectId)}/requirements`;
}

function recordPath(projectId: string, requirementId: string): string {
  return `${collectionPath(projectId)}/${encodeURIComponent(requirementId)}`;
}

function assertProject(project: Project, ownerId: string, projectId: string): void {
  if (!project.id || project.id !== projectId || project.ownerId !== ownerId) {
    throw new Error("Project not found in the current workspace.");
  }
}

function normalizedValues(values: RequirementFormValues) {
  if (!values.title.trim() || values.title.trim().length > 180) {
    throw new Error("Enter a requirement title between 1 and 180 characters.");
  }
  if (values.description.length > 3000 || values.acceptanceCriteria.length > 3000) {
    throw new Error("Requirement details must be 3,000 characters or fewer.");
  }
  if (!requirementTypes.has(values.type) || !requirementStatuses.has(values.status) || !requirementPriorities.has(values.priority)) {
    throw new Error("Choose valid requirement type, status, and priority values.");
  }
  return {
    title: values.title.trim(),
    description: values.description.trim() || undefined,
    acceptanceCriteria: values.acceptanceCriteria.trim() || undefined,
    type: values.type,
    priority: values.priority,
    status: values.status,
  };
}

export async function getWorkspaceRequirements(ownerId: string, workspaceId: string): Promise<Requirement[]> {
  const projects = await getProjects(ownerId, workspaceId);
  const requirements = await Promise.all(projects.map((project) => getRequirements(ownerId, project)));
  return requirements.flat().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getRequirements(ownerId: string, project: Project): Promise<Requirement[]> {
  assertProject(project, ownerId, project.id);
  const records = await requestLocalData<Requirement[]>(collectionPath(project.id));
  return records.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getRequirement(
  ownerId: string,
  project: Project,
  requirementId: string,
): Promise<Requirement | null> {
  assertProject(project, ownerId, project.id);
  const requirements = await getRequirements(ownerId, project);
  return requirements.find((item) => item.id === requirementId) ?? null;
}

export async function searchRequirements(
  ownerId: string,
  project: Project,
  searchTerm: string,
): Promise<Requirement[]> {
  const requirements = await getRequirements(ownerId, project);
  const term = searchTerm.trim().toLocaleLowerCase();
  if (!term) return requirements;
  return requirements.filter((item) =>
    `${item.code} ${item.title} ${item.description ?? ""} ${item.acceptanceCriteria ?? ""}`
      .toLocaleLowerCase()
      .includes(term),
  );
}

export async function createRequirement(
  ownerId: string,
  project: Project,
  values: RequirementFormValues,
): Promise<Requirement> {
  assertProject(project, ownerId, project.id);
  const requirement = await requestLocalData<Requirement>(collectionPath(project.id), {
    method: "POST",
    body: JSON.stringify(normalizedValues(values)),
  });
  await emitActivityEvent({
    ownerId,
    projectId: project.id,
    entityType: "requirement",
    entityId: requirement.id,
    entityName: requirement.title,
    action: "created",
    description: `Created requirement "${requirement.title}".`,
    metadata: { projectName: project.name, requirementCode: requirement.code },
  });
  return requirement;
}

export async function updateRequirement(
  ownerId: string,
  project: Project,
  requirementId: string,
  values: RequirementFormValues,
): Promise<Requirement> {
  assertProject(project, ownerId, project.id);
  const existing = await getRequirement(ownerId, project, requirementId);
  if (!existing) throw new Error("Requirement not found in this project.");
  const normalized = normalizedValues(values);
  const updated = await requestLocalData<Requirement>(recordPath(project.id, requirementId), {
    method: "PATCH",
    body: JSON.stringify(normalized),
  });
  const action = existing.status !== updated.status
    ? updated.status === "approved" || updated.status === "rejected" ? updated.status : "status_changed"
    : "updated";
  await emitActivityEvent({
    ownerId,
    projectId: project.id,
    entityType: "requirement",
    entityId: updated.id,
    entityName: updated.title,
    action,
    description: `Updated requirement "${updated.title}".`,
    metadata: { projectName: project.name, requirementCode: updated.code, status: updated.status },
  });
  return updated;
}

export async function updateRequirementStatus(
  ownerId: string,
  project: Project,
  requirementId: string,
  status: RequirementStatus,
): Promise<Requirement> {
  assertProject(project, ownerId, project.id);
  if (!requirementStatuses.has(status)) throw new Error("Choose a valid requirement status.");
  const updated = await requestLocalData<Requirement>(recordPath(project.id, requirementId), {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  await emitActivityEvent({
    ownerId,
    projectId: project.id,
    entityType: "requirement",
    entityId: updated.id,
    entityName: updated.title,
    action: status === "approved" || status === "rejected" ? status : "status_changed",
    description: `Changed requirement "${updated.title}" to ${status.replace("_", " ")}.`,
    metadata: { projectName: project.name, requirementCode: updated.code, status },
  });
  return updated;
}

export async function deleteRequirement(
  ownerId: string,
  project: Project,
  requirementId: string,
): Promise<Requirement> {
  return updateRequirementStatus(ownerId, project, requirementId, "archived");
}
