import { getLocalUserId, requestLocalData } from "@/lib/localData";
import type { Workspace } from "@/types/workspace";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export async function createWorkspace(
  workspace: Omit<Workspace, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const created = await requestLocalData<Workspace>("/api/workspaces", {
    method: "POST",
    body: JSON.stringify(workspace),
  });
  return created.id;
}

export async function getWorkspace(workspaceId: string): Promise<Workspace | null> {
  try {
    return await requestLocalData<Workspace>(`/api/workspaces/${encodeURIComponent(workspaceId)}`);
  } catch (error) {
    if (error instanceof Error && "status" in error && error.status === 404) return null;
    throw error;
  }
}

export async function updateWorkspace(
  workspaceId: string,
  data: { name?: string; type?: string; description?: string; logoURL?: string | null },
): Promise<void> {
  getLocalUserId();
  const updates = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined && value !== null),
  );
  await requestLocalData<Workspace>(`/api/workspaces/${encodeURIComponent(workspaceId)}`, {
    method: "PATCH",
    body: JSON.stringify({ ...updates, ...(data.logoURL === null ? { logoURL: null } : {}) }),
  });
}

export async function uploadWorkspaceLogo(file: File, workspaceId: string): Promise<string> {
  if (!IMAGE_TYPES.has(file.type)) throw new Error("Choose a JPG, PNG, or WebP image.");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("Choose an image no larger than 5 MB.");
  const workspace = await getWorkspace(workspaceId);
  if (!workspace || workspace.ownerId !== getLocalUserId()) {
    throw new Error("Only the workspace owner can upload a logo.");
  }
  const logoURL = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string"
      ? resolve(reader.result)
      : reject(new Error("The selected logo could not be read."));
    reader.onerror = () => reject(new Error("The selected logo could not be read."));
    reader.readAsDataURL(file);
  });
  await updateWorkspace(workspaceId, { logoURL });
  return logoURL;
}

export async function deleteWorkspaceLogo(workspaceId: string): Promise<void> {
  await updateWorkspace(workspaceId, { logoURL: null });
}
