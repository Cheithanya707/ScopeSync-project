import { emitActivityEvent } from "@/lib/activityEvents";
import { requestApi } from "@/lib/apiClient";
import { requestLocalData } from "@/lib/localData";
import type { Project, ProjectDocument } from "@/types";

type StoredDocument = ProjectDocument & { downloadUrl?: string };

function documentsPath(projectId: string): string {
  return `/api/projects/${encodeURIComponent(projectId)}/documents`;
}

function documentPath(projectId: string, documentId: string): string {
  return `${documentsPath(projectId)}/${encodeURIComponent(documentId)}`;
}

function verifyProject(project: Project, ownerId: string): void {
  if (!project.id || !project.workspaceId || project.ownerId !== ownerId) {
    throw new Error("Project not found in this workspace.");
  }
}

export async function getProjectDocuments(ownerId: string, project: Project): Promise<ProjectDocument[]> {
  verifyProject(project, ownerId);
  return requestLocalData<ProjectDocument[]>(documentsPath(project.id));
}

export async function getWorkspaceDocuments(
  ownerId: string,
  workspaceId: string,
  projects: Project[],
): Promise<ProjectDocument[]> {
  const validProjects = projects.filter((project) => project.ownerId === ownerId && project.workspaceId === workspaceId);
  return (await Promise.all(validProjects.map((project) => getProjectDocuments(ownerId, project))))
    .flat()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getDocument(ownerId: string, project: Project, documentId: string): Promise<ProjectDocument | null> {
  return (await getProjectDocuments(ownerId, project)).find((document) => document.id === documentId) ?? null;
}

export async function saveDocument(
  ownerId: string,
  project: Project,
  document: ProjectDocument,
  file: File,
): Promise<ProjectDocument> {
  verifyProject(project, ownerId);
  if (document.workspaceId !== project.workspaceId || document.projectId !== project.id) {
    throw new Error("Document does not belong to this project.");
  }
  const formData = new FormData();
  formData.set("file", file);
  formData.set("name", document.name);
  formData.set("fileType", document.fileType);
  formData.set("isShared", String(document.isShared ?? false));
  if (document.description) formData.set("description", document.description);
  const uploaded = await requestLocalData<ProjectDocument>(documentsPath(project.id), {
    method: "POST",
    body: formData,
  });
  await emitActivityEvent({
    ownerId,
    projectId: project.id,
    entityType: "document",
    entityId: uploaded.id,
    entityName: uploaded.name,
    action: "uploaded",
    description: `Uploaded document "${uploaded.name}".`,
    metadata: { projectName: project.name },
  });
  return uploaded;
}

export async function updateDocumentMetadata(
  ownerId: string,
  project: Project,
  documentId: string,
  updates: Pick<ProjectDocument, "name" | "description" | "isShared">,
): Promise<ProjectDocument> {
  verifyProject(project, ownerId);
  const current = await getDocument(ownerId, project, documentId);
  if (!current) throw new Error("Document not found in this project.");
  const updated = await requestLocalData<ProjectDocument>(documentPath(project.id, documentId), {
    method: "PATCH",
    body: JSON.stringify({
      name: updates.name.trim(),
      description: updates.description?.trim() || undefined,
      isShared: updates.isShared ?? false,
    }),
  });
  await emitActivityEvent({
    ownerId,
    projectId: project.id,
    entityType: "document",
    entityId: updated.id,
    entityName: updated.name,
    action: "updated",
    description: `Updated document "${updated.name}".`,
    metadata: { projectName: project.name },
  });
  return updated;
}

export async function getDocumentFile(ownerId: string, project: Project, documentId: string): Promise<Blob> {
  verifyProject(project, ownerId);
  const document = await requestLocalData<StoredDocument>(documentPath(project.id, documentId));
  if (!document.downloadUrl) throw new Error("The document download URL is unavailable.");
  return requestApi<Blob>(document.downloadUrl, {}, { responseType: "blob" });
}

export async function deleteDocument(ownerId: string, project: Project, documentId: string): Promise<void> {
  verifyProject(project, ownerId);
  const current = await getDocument(ownerId, project, documentId);
  if (!current) throw new Error("Document not found in this project.");
  await requestLocalData<{ deleted: boolean }>(documentPath(project.id, documentId), { method: "DELETE" });
  await emitActivityEvent({
    ownerId,
    projectId: project.id,
    entityType: "document",
    entityId: current.id,
    entityName: current.name,
    action: "deleted",
    description: `Deleted document "${current.name}".`,
    metadata: { projectName: project.name },
  });
}
