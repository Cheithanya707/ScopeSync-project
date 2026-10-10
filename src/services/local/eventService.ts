import { getLocalUserId, requestLocalData } from "@/lib/localData";
import type { EventDetails } from "@/types";

type StoredEventDetails = EventDetails & { id: string };

function assertWorkspace(workspaceId: string): void {
  if (!workspaceId.trim()) throw new Error("A workspace is required to manage this event.");
}

export async function getEventDetails(
  projectId: string,
  workspaceId: string,
  ownerId = getLocalUserId(),
): Promise<StoredEventDetails | null> {
  assertWorkspace(workspaceId);
  void ownerId;
  return (await requestLocalData<StoredEventDetails[]>("/api/eventDetails"))
    .find((details) => details.projectId === projectId && details.workspaceId === workspaceId) ?? null;
}

export async function createEventDetails(
  data: EventDetails,
  ownerId = getLocalUserId(),
): Promise<void> {
  assertWorkspace(data.workspaceId);
  void ownerId;
  if (!data.projectId.trim() || !data.eventName.trim()) throw new Error("An event name and project are required.");
  const details = await requestLocalData<EventDetails[]>("/api/eventDetails");
  if (details.some((item) => item.projectId === data.projectId && item.workspaceId === data.workspaceId)) {
    throw new Error("Event details already exist for this project. Update the existing event instead.");
  }
  await requestLocalData<EventDetails>("/api/eventDetails", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEventDetails(
  projectId: string,
  workspaceId: string,
  data: Partial<Omit<EventDetails, "projectId" | "workspaceId" | "createdAt">>,
  ownerId = getLocalUserId(),
): Promise<void> {
  assertWorkspace(workspaceId);
  void ownerId;
  const current = await getEventDetails(projectId, workspaceId, ownerId);
  if (!current?.id) throw new Error("Set up event details before editing them.");
  await requestLocalData<EventDetails>(`/api/eventDetails/${encodeURIComponent(current.id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
