import { getDocumentFile } from "@/services/documents/documentStore";
import type { Project, ProjectDocument } from "@/types";

async function createDocumentObjectUrl(ownerId: string, project: Project, document: ProjectDocument): Promise<string> {
  const blob = await getDocumentFile(ownerId, project, document.id);
  return URL.createObjectURL(new Blob([blob], { type: document.mimeType || "application/octet-stream" }));
}

export async function openProjectDocument(ownerId: string, project: Project, document: ProjectDocument): Promise<void> {
  const opened = window.open("about:blank", "_blank");
  if (!opened) {
    throw new Error("Your browser blocked the document tab. Allow pop-ups and try again.");
  }
  opened.opener = null;
  let url: string;
  try {
    url = await createDocumentObjectUrl(ownerId, project, document);
  } catch (error) {
    opened.close();
    throw error;
  }
  opened.location.replace(url);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadProjectDocument(ownerId: string, project: Project, document: ProjectDocument): Promise<void> {
  const url = await createDocumentObjectUrl(ownerId, project, document);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = document.originalName;
  window.document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
