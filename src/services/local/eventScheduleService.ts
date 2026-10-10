import { getLocalUserId, requestLocalData } from "@/lib/localData";
import type { EventScheduleItem } from "@/types";
import { omitUndefinedFields } from "@/services/events/eventPreviewStore";
import { emitActivityEvent } from "@/lib/activityEvents";

const COLLECTION = "eventScheduleItems";
const actor = getLocalUserId;

export async function getScheduleItems(projectId: string, workspaceId: string, ownerId = actor()): Promise<EventScheduleItem[]> {
  void ownerId;
  return (await requestLocalData<EventScheduleItem[]>(`/api/${COLLECTION}`))
    .filter((item) => item.workspaceId === workspaceId && item.projectId === projectId)
    .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));
}

export async function createScheduleItem(data: Omit<EventScheduleItem, "id" | "createdAt" | "updatedAt">, ownerId = actor()): Promise<EventScheduleItem> {
  validateSchedule(data);
  const item = await requestLocalData<EventScheduleItem>(`/api/${COLLECTION}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  await emitActivityEvent({ ownerId, projectId: data.projectId, entityType: "calendar", entityId: item.id, entityName: item.title, action: "created", description: `Added "${item.title}" to the event schedule.` });
  return item;
}

function validateSchedule(data: Pick<EventScheduleItem, "title" | "startDateTime" | "endDateTime">): void {
  if (!data.title.trim()) throw new Error("Schedule item title is required.");
  if (!data.startDateTime || !data.endDateTime || new Date(data.endDateTime) <= new Date(data.startDateTime)) {
    throw new Error("The end time must be after the start time.");
  }
}

export async function updateScheduleItem(
  itemId: string,
  projectId: string,
  workspaceId: string,
  data: Partial<Pick<EventScheduleItem, "title" | "description" | "location" | "startDateTime" | "endDateTime" | "type">>,
  ownerId = actor(),
): Promise<EventScheduleItem> {
  const current = (await getScheduleItems(projectId, workspaceId, ownerId)).find((item) => item.id === itemId);
  if (!current) throw new Error("Schedule item not found in this event.");
  const next = { ...current, ...data };
  validateSchedule(next);
  await requestLocalData<EventScheduleItem>(`/api/${COLLECTION}/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify(omitUndefinedFields(data)),
  });
  await emitActivityEvent({ ownerId, projectId, entityType: "calendar", entityId: itemId, entityName: next.title, action: "updated", description: `Updated event schedule item "${next.title}".` });
  return next;
}

export async function deleteScheduleItem(itemId: string, projectId: string, workspaceId: string, ownerId = actor()): Promise<void> {
  const current = (await getScheduleItems(projectId, workspaceId, ownerId)).find((item) => item.id === itemId);
  if (!current) throw new Error("Schedule item not found in this event.");
  await requestLocalData<{ deleted: boolean }>(`/api/${COLLECTION}/${encodeURIComponent(itemId)}`, { method: "DELETE" });
  await emitActivityEvent({ ownerId, projectId, entityType: "calendar", entityId: itemId, entityName: current.title, action: "deleted", description: `Removed event schedule item "${current.title}".` });
}
