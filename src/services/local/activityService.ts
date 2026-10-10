import { getLocalUserId, requestLocalData } from "@/lib/localData";
import type { Activity } from "@/types";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 250;

function boundedLimit(value: number): number {
  return Math.max(1, Math.min(Math.floor(value), MAX_LIMIT));
}

export async function createActivity(data: Omit<Activity, "id" | "createdAt">): Promise<string> {
  const ownerId = getLocalUserId();
  if (data.actorId !== ownerId) throw new Error("Activity can only be recorded for the signed-in user.");
  if (!data.workspaceId.trim() || !data.entityId.trim() || !data.entityName.trim()) {
    throw new Error("Activity is missing required workspace or entity details.");
  }
  const activity = await requestLocalData<Activity>("/api/activities", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return activity.id;
}

export async function getWorkspaceActivities(
  workspaceId: string,
  resultLimit = DEFAULT_LIMIT,
): Promise<Activity[]> {
  return (await requestLocalData<Activity[]>("/api/activities"))
    .filter((activity) => activity.workspaceId === workspaceId)
    .sort((left, right) => String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? "")))
    .slice(0, boundedLimit(resultLimit));
}

export async function getProjectActivities(
  workspaceId: string,
  projectId: string,
  resultLimit = DEFAULT_LIMIT,
): Promise<Activity[]> {
  return (await getWorkspaceActivities(workspaceId, resultLimit))
    .filter((activity) => activity.projectId === projectId);
}

export async function getRecentActivities(workspaceId: string, resultLimit: number): Promise<Activity[]> {
  return getWorkspaceActivities(workspaceId, resultLimit);
}

export async function deleteActivity(activityId: string): Promise<void> {
  await requestLocalData<{ deleted: boolean }>(`/api/activities/${encodeURIComponent(activityId)}`, {
    method: "DELETE",
  });
}
