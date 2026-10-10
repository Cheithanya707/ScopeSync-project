import { getLocalUserId, requestLocalData } from "@/lib/localData";
import { emitActivityEvent } from "@/lib/activityEvents";
import type { ProjectShare, ProjectSharePermissions, ProjectShareRole } from "@/types";

const ROLES = new Set<ProjectShareRole>(["client", "stakeholder", "event_organizer", "reviewer"]);
const PERMISSION_KEYS: (keyof ProjectSharePermissions)[] = [
  "viewProject", "viewRequirements", "viewTasks", "viewChanges", "viewCalendar",
  "viewDocuments", "viewPayments", "submitChangeRequest", "approveChanges", "comment",
];

export class ShareAccessError extends Error {
  constructor(readonly code: "revoked" | "inactive" | "permission" | "secure_endpoint_unavailable") {
    super(code === "revoked"
      ? "This project share has been revoked."
      : code === "inactive"
        ? "This project share is not active."
        : code === "permission"
        ? "This shared view does not have project overview permission."
        : "Secure public share access is not configured.");
    this.name = "ShareAccessError";
  }
}

export const DEFAULT_PROJECT_SHARE_PERMISSIONS: ProjectSharePermissions = {
  viewProject: true,
  viewRequirements: true,
  viewTasks: true,
  viewChanges: true,
  viewCalendar: true,
  viewDocuments: false,
  viewPayments: false,
  submitChangeRequest: false,
  comment: false,
};

function requireSignedInOwner(ownerId: string): void {
  if (getLocalUserId() !== ownerId) {
    throw new Error("Only the signed-in workspace owner can manage project access.");
  }
}

function validateShareInput(data: {
  email: string;
  role: ProjectShareRole;
  permissions: ProjectSharePermissions;
}): void {
  if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    throw new Error("Enter a valid email address.");
  }
  if (!ROLES.has(data.role)) throw new Error("Choose a valid access role.");
  const allowed = PERMISSION_KEYS.some((key) => data.permissions[key] === true);
  if (!allowed) throw new Error("Select at least one permission.");
  for (const key of PERMISSION_KEYS) {
    if (data.permissions[key] !== undefined && typeof data.permissions[key] !== "boolean") {
      throw new Error("One or more access permissions are invalid.");
    }
  }
}

function track(ownerId: string, workspaceId: string, projectId: string, share: ProjectShare, action: "created" | "revoked" | "restored"): Promise<void> {
  const names = { created: "Client access created", revoked: "Client access revoked", restored: "Client access restored" } as const;
  return emitActivityEvent({
    ownerId,
    projectId,
    entityType: "project",
    entityId: share.id,
    entityName: names[action],
    action: action === "created" ? "created" : "status_changed",
    description: `${names[action]} for ${share.displayName?.trim() || share.email}.`,
    metadata: { workspaceId, projectId, shareRole: share.role },
  });
}

export async function createProjectShare(
  data: Omit<ProjectShare, "id" | "status" | "accessToken" | "createdAt" | "updatedAt" | "lastAccessedAt" | "createdBy">,
  ownerId = getLocalUserId(),
): Promise<ProjectShare> {
  validateShareInput(data);
  requireSignedInOwner(ownerId);
  const share = await requestLocalData<ProjectShare>("/api/project-shares", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      email: data.email.trim().toLowerCase(),
      displayName: data.displayName?.trim() || undefined,
    }),
  });
  await track(ownerId, data.workspaceId, data.projectId, share, "created");
  return share;
}

export async function getProjectShares(
  projectId: string,
  workspaceId: string,
  ownerId = getLocalUserId(),
): Promise<ProjectShare[]> {
  requireSignedInOwner(ownerId);
  return (await requestLocalData<ProjectShare[]>("/api/project-shares"))
    .filter((share) => share.workspaceId === workspaceId && share.projectId === projectId)
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
}

export async function getProjectShare(shareId: string, ownerId = getLocalUserId()): Promise<ProjectShare | null> {
  requireSignedInOwner(ownerId);
  const shares = await requestLocalData<ProjectShare[]>("/api/project-shares");
  return shares.find((share) => share.id === shareId) ?? null;
}

export async function updateProjectShare(
  shareId: string,
  data: Pick<ProjectShare, "displayName" | "role" | "permissions">,
  ownerId = getLocalUserId(),
): Promise<ProjectShare> {
  validateShareInput({ email: "valid@example.com", role: data.role, permissions: data.permissions });
  requireSignedInOwner(ownerId);
  const current = await getProjectShare(shareId, ownerId);
  if (!current) throw new Error("Project access was not found.");
  return requestLocalData<ProjectShare>(`/api/project-shares/${encodeURIComponent(shareId)}`, {
    method: "PATCH",
    body: JSON.stringify({ ...data, displayName: data.displayName?.trim() || "" }),
  });
}

export async function revokeProjectShare(shareId: string, ownerId = getLocalUserId()): Promise<ProjectShare> {
  return changeStatus(shareId, "revoked", ownerId);
}

export async function restoreProjectShare(shareId: string, ownerId = getLocalUserId()): Promise<ProjectShare> {
  return changeStatus(shareId, "active", ownerId);
}

async function changeStatus(shareId: string, status: "active" | "revoked", ownerId: string): Promise<ProjectShare> {
  requireSignedInOwner(ownerId);
  const current = await getProjectShare(shareId, ownerId);
  if (!current) throw new Error("Project access was not found.");
  const wasRevoked = current.status === "revoked";
  const updated = await requestLocalData<ProjectShare>(`/api/project-shares/${encodeURIComponent(shareId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  if ((status === "revoked" && current.status !== "revoked") || (status === "active" && wasRevoked)) {
    await track(ownerId, current.workspaceId, current.projectId, updated, status === "revoked" ? "revoked" : "restored");
  }
  return updated;
}
