import { getLocalUserId, requestLocalData } from "@/lib/localData";
import type { EventParticipant } from "@/types";
import { omitUndefinedFields } from "@/services/events/eventPreviewStore";
import { emitActivityEvent } from "@/lib/activityEvents";

const COLLECTION = "eventParticipants";
const actor = getLocalUserId;

export async function getParticipants(projectId: string, workspaceId: string, ownerId = actor()): Promise<EventParticipant[]> {
  void ownerId;
  return (await requestLocalData<EventParticipant[]>(`/api/${COLLECTION}`))
    .filter((item) => item.workspaceId === workspaceId && item.projectId === projectId)
    .sort((a, b) => String(b.registrationDate ?? "").localeCompare(String(a.registrationDate ?? "")));
}

export async function getParticipant(
  participantId: string,
  projectId: string,
  workspaceId: string,
  ownerId = actor(),
): Promise<EventParticipant | null> {
  return (await getParticipants(projectId, workspaceId, ownerId)).find((item) => item.id === participantId) ?? null;
}

export async function createParticipant(data: Omit<EventParticipant, "id" | "createdAt" | "updatedAt" | "registrationDate">, ownerId = actor()): Promise<EventParticipant> {
  if (!data.name.trim() || !data.email.trim()) throw new Error("Participant name and email are required.");
  const all = await requestLocalData<EventParticipant[]>(`/api/${COLLECTION}`);
  if (all.some((item) => item.workspaceId === data.workspaceId && item.projectId === data.projectId && item.email.toLowerCase() === data.email.trim().toLowerCase() && item.registrationStatus !== "cancelled")) {
    throw new Error("A participant with this email is already registered for this event.");
  }
  const participant = await requestLocalData<EventParticipant>(`/api/${COLLECTION}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  await emitActivityEvent({
    ownerId,
    projectId: participant.projectId,
    entityType: "member",
    entityId: participant.id,
    entityName: participant.name,
    action: "created",
    description: `Registered participant "${participant.name}".`,
  });
  return participant;
}

export async function updateParticipant(
  participantId: string,
  projectId: string,
  workspaceId: string,
  data: Partial<Pick<EventParticipant, "name" | "email" | "phone" | "college" | "organization" | "department" | "year" | "participantType" | "registrationStatus" | "paymentStatus" | "teamId">>,
  ownerId = actor(),
): Promise<EventParticipant> {
  const current = await getParticipant(participantId, projectId, workspaceId, ownerId);
  if (!current) throw new Error("Participant not found in this event.");
  const updated = { ...current, ...omitUndefinedFields(data), updatedAt: new Date().toISOString() };
  await requestLocalData<EventParticipant>(`/api/${COLLECTION}/${encodeURIComponent(participantId)}`, {
    method: "PATCH",
    body: JSON.stringify(omitUndefinedFields(data)),
  });
  if (data.registrationStatus && data.registrationStatus !== current.registrationStatus) {
    await emitActivityEvent({ ownerId, projectId, entityType: "member", entityId: participantId, entityName: updated.name, action: "status_changed", description: `Changed participant "${updated.name}" status to ${data.registrationStatus}.` });
  } else {
    await emitActivityEvent({ ownerId, projectId, entityType: "member", entityId: participantId, entityName: updated.name, action: "updated", description: `Updated participant "${updated.name}".` });
  }
  return updated;
}

export async function deleteParticipant(participantId: string, projectId: string, workspaceId: string, ownerId = actor()): Promise<void> {
  const current = await getParticipant(participantId, projectId, workspaceId, ownerId);
  if (!current) throw new Error("Participant not found in this event.");
  const teams = await requestLocalData<Array<{ id: string; workspaceId: string; projectId: string; participantIds: string[]; leaderParticipantId?: string | null }>>(`/api/eventTeams?workspaceId=${encodeURIComponent(workspaceId)}&projectId=${encodeURIComponent(projectId)}`);
  await Promise.all(teams.filter((team) => team.participantIds.includes(participantId)).map((team) =>
    requestLocalData(`/api/eventTeams/${encodeURIComponent(team.id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        participantIds: team.participantIds.filter((id) => id !== participantId),
        ...(team.leaderParticipantId === participantId ? { leaderParticipantId: null } : {}),
      }),
    }),
  ));
  await requestLocalData<{ deleted: boolean }>(`/api/${COLLECTION}/${encodeURIComponent(participantId)}`, { method: "DELETE" });
  await emitActivityEvent({ ownerId, projectId, entityType: "member", entityId: participantId, entityName: current.name, action: "removed", description: `Removed participant "${current.name}" from the event.` });
}
