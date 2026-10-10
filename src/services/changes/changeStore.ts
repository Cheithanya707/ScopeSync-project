import { emitActivityEvent } from "@/lib/activityEvents";
import { requestLocalData } from "@/lib/localData";
import { getRequirements } from "@/services/requirements/requirementStore";
import type { ChangeStatus, Project, ScopeChange, ScopeChangeFormValues } from "@/types";

function collectionPath(projectId: string): string {
  return `/api/projects/${encodeURIComponent(projectId)}/scopeChanges`;
}

function recordPath(projectId: string, changeId: string): string {
  return `${collectionPath(projectId)}/${encodeURIComponent(changeId)}`;
}

function assertProject(project: Project, ownerId: string): void {
  if (!project.id || project.ownerId !== ownerId) throw new Error("Project not found in this workspace.");
}

async function validateValues(ownerId: string, project: Project, values: ScopeChangeFormValues) {
  const title = values.title.trim();
  if (!title || title.length > 180) throw new Error("Enter a change request title between 1 and 180 characters.");
  if (values.description.length > 3000) throw new Error("Description must be 3,000 characters or fewer.");
  const [requirements, tasks] = await Promise.all([
    getRequirements(ownerId, project),
    requestLocalData<Array<{ id: string }>>(`/api/projects/${encodeURIComponent(project.id)}/tasks`),
  ]);
  const affectedRequirementIds = [...new Set(values.affectedRequirementIds)];
  const affectedTaskIds = [...new Set(values.affectedTaskIds)];
  if (affectedRequirementIds.some((id) => !requirements.some((item) => item.id === id))) {
    throw new Error("Choose requirements from this project.");
  }
  if (affectedTaskIds.some((id) => !tasks.some((item) => item.id === id))) {
    throw new Error("Choose tasks from this project.");
  }
  return {
    title,
    description: values.description.trim() || undefined,
    type: values.type,
    priority: values.priority,
    source: values.source,
    affectedRequirementIds,
    affectedTaskIds,
    requestedDate: values.requestedDate || undefined,
  };
}

export async function getScopeChanges(ownerId: string, project: Project): Promise<ScopeChange[]> {
  assertProject(project, ownerId);
  return requestLocalData<ScopeChange[]>(collectionPath(project.id));
}

export async function getScopeChange(ownerId: string, project: Project, id: string): Promise<ScopeChange | null> {
  return (await getScopeChanges(ownerId, project)).find((change) => change.id === id) ?? null;
}

export async function createScopeChange(ownerId: string, project: Project, values: ScopeChangeFormValues): Promise<ScopeChange> {
  assertProject(project, ownerId);
  const change = await requestLocalData<ScopeChange>(collectionPath(project.id), {
    method: "POST",
    body: JSON.stringify({ ...await validateValues(ownerId, project, values), status: "new" }),
  });
  await emitActivityEvent({
    ownerId,
    projectId: project.id,
    entityType: "scope_change",
    entityId: change.id,
    entityName: change.title,
    action: "submitted",
    description: `Submitted scope change "${change.title}".`,
    metadata: { projectName: project.name },
  });
  return change;
}

export async function updateScopeChange(
  ownerId: string,
  project: Project,
  id: string,
  values: ScopeChangeFormValues,
): Promise<ScopeChange> {
  assertProject(project, ownerId);
  const current = await getScopeChange(ownerId, project, id);
  if (!current || ["approved", "rejected", "implemented", "cancelled"].includes(current.status)) {
    throw new Error("Only new or under-review change requests can be edited.");
  }
  const updated = await requestLocalData<ScopeChange>(recordPath(project.id, id), {
    method: "PATCH",
    body: JSON.stringify(await validateValues(ownerId, project, values)),
  });
  return updated;
}

async function changeStatus(
  ownerId: string,
  project: Project,
  id: string,
  status: ChangeStatus,
  extra: { reviewNotes?: string; rejectionReason?: string } = {},
): Promise<ScopeChange> {
  assertProject(project, ownerId);
  const updated = await requestLocalData<ScopeChange>(recordPath(project.id, id), {
    method: "PATCH",
    body: JSON.stringify({ ...extra, status }),
  });
  await emitActivityEvent({
    ownerId,
    projectId: project.id,
    entityType: "scope_change",
    entityId: updated.id,
    entityName: updated.title,
    action: status === "approved" || status === "rejected" ? status : "status_changed",
    description: `Changed scope change "${updated.title}" to ${status.replace("_", " ")}.`,
    metadata: { status, projectName: project.name },
  });
  return updated;
}

export function updateChangeStatus(ownerId: string, project: Project, id: string, status: ChangeStatus) {
  if (status !== "under_review" && status !== "cancelled") {
    throw new Error("Use the dedicated approval, rejection, or implementation action.");
  }
  return changeStatus(ownerId, project, id, status);
}

export function startChangeReview(ownerId: string, project: Project, id: string, reviewNotes?: string) {
  return changeStatus(ownerId, project, id, "under_review", { reviewNotes: reviewNotes?.trim() || undefined });
}

export function approveScopeChange(ownerId: string, project: Project, id: string, reviewNotes?: string) {
  return changeStatus(ownerId, project, id, "approved", { reviewNotes: reviewNotes?.trim() || undefined });
}

export function rejectScopeChange(
  ownerId: string,
  project: Project,
  id: string,
  rejectionReason: string,
  reviewNotes?: string,
) {
  if (!rejectionReason.trim()) throw new Error("A rejection reason is required.");
  return changeStatus(ownerId, project, id, "rejected", {
    rejectionReason: rejectionReason.trim(),
    reviewNotes: reviewNotes?.trim() || undefined,
  });
}

export function markChangeImplemented(ownerId: string, project: Project, id: string) {
  return changeStatus(ownerId, project, id, "implemented");
}

export async function deleteScopeChange(ownerId: string, project: Project, id: string): Promise<void> {
  const change = await getScopeChange(ownerId, project, id);
  if (!change) throw new Error("Change request not found in this project.");
  if (change.status !== "new" && change.status !== "under_review") {
    throw new Error("Reviewed scope changes are retained in project history and cannot be deleted.");
  }
  await changeStatus(ownerId, project, id, "cancelled");
}
