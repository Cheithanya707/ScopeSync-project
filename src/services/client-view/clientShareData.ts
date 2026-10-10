import { ApiError, requestApi } from "@/lib/apiClient";
import { ShareAccessError } from "@/services/local/projectShareService";
import type { CalendarEvent, EventDetails, Payment, Project, ProjectDocument, ProjectShare, Requirement, TaskPriority, TaskStatus } from "@/types";

export interface ClientTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
}

export interface ClientChange {
  id: string;
  title: string;
  description?: string;
  status: string;
  requestedDate?: string;
  priority: TaskPriority;
}

export interface ClientDocument {
  id: string;
  name: string;
  originalName: string;
  fileType: ProjectDocument["fileType"];
  size: number;
  description?: string;
}

export type ClientRequirement = Pick<
  Requirement,
  "id" | "code" | "title" | "status" | "description" | "acceptanceCriteria" | "type" | "priority" | "approved"
>;

export interface ClientCalendarDate {
  id: string;
  title: string;
  date: string;
  type: CalendarEvent["type"];
}

export interface ClientShareSnapshot {
  share: Pick<ProjectShare, "role" | "permissions">;
  project: Pick<Project, "id" | "workspaceId" | "name" | "description" | "type" | "status" | "startDate" | "deadline">;
  tasks: ClientTask[];
  requirements: ClientRequirement[];
  changes: ClientChange[];
  calendar: ClientCalendarDate[];
  documents: ClientDocument[];
  payments: Pick<Payment, "id" | "title" | "type" | "amount" | "currency" | "status" | "dueDate" | "paidDate">[];
  eventDetails: Pick<EventDetails, "eventName" | "shortDescription" | "venue" | "startDate" | "endDate"> | null;
}

export async function loadClientShare(token: string): Promise<ClientShareSnapshot | null> {
  try {
    return await requestApi<ClientShareSnapshot | null>(
      `/api/public/shares/${encodeURIComponent(token)}`,
      {},
      { authenticated: false },
    );
  } catch (error) {
    if (error instanceof ApiError && error.code === "share_revoked") throw new ShareAccessError("revoked");
    if (error instanceof ApiError && error.code === "share_inactive") throw new ShareAccessError("inactive");
    throw error;
  }
}

export async function submitClientChangeRequest(
  token: string,
  values: { title: string; description: string; priority: TaskPriority },
): Promise<void> {
  if (!values.title.trim() || values.title.trim().length > 120) throw new Error("Enter a change title (up to 120 characters).");
  if (!values.description.trim() || values.description.trim().length > 3000) throw new Error("Enter a description (up to 3,000 characters).");
  await requestApi(`/api/public/shares/${encodeURIComponent(token)}/change-requests`, {
    method: "POST",
    body: JSON.stringify(values),
  }, { authenticated: false });
}

export async function downloadSharedDocument(token: string, documentId: string): Promise<{ file: Blob; name: string; mimeType: string }> {
  const snapshot = await loadClientShare(token);
  const document = snapshot?.documents.find((item) => item.id === documentId);
  if (!document) throw new Error("This document is not available to external viewers.");
  const file = await requestApi<Blob>(
    `/api/public/shares/${encodeURIComponent(token)}/files/${encodeURIComponent(documentId)}`,
    {},
    { authenticated: false, responseType: "blob" },
  );
  return { file, name: document.originalName, mimeType: file.type || "application/octet-stream" };
}
