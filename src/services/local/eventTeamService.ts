import { getLocalUserId, requestLocalData } from "@/lib/localData";
import type { EventParticipant, EventTeam } from "@/types";
import { omitUndefinedFields } from "@/services/events/eventPreviewStore";
import { emitActivityEvent } from "@/lib/activityEvents";

const COLLECTION = "eventTeams";
const PARTICIPANTS = "eventParticipants";
const actor = getLocalUserId;

export async function getEventTeams(projectId: string, workspaceId: string, ownerId = actor()): Promise<EventTeam[]> {
  void ownerId;
  return (await requestLocalData<EventTeam[]>(`/api/${COLLECTION}`))
    .filter((item) => item.workspaceId === workspaceId && item.projectId === projectId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getEventTeam(teamId: string, projectId: string, workspaceId: string, ownerId = actor()): Promise<EventTeam | null> {
  return (await getEventTeams(projectId, workspaceId, ownerId)).find((team) => team.id === teamId) ?? null;
}

async function verifyParticipants(participantIds: string[], projectId: string, workspaceId: string, ownerId: string, currentTeamId?: string): Promise<EventParticipant[]> {
  const ids = [...new Set(participantIds)];
  if (ids.length !== participantIds.length) throw new Error("A participant cannot be added to the same team more than once.");
  const participants = await requestLocalData<EventParticipant[]>(`/api/${PARTICIPANTS}`);
  const records = ids.map((id) => participants.find((item) => item.id === id && item.projectId === projectId && item.workspaceId === workspaceId));
  if (records.some((item) => !item)) throw new Error("Only participants registered for this event can join its teams.");
  const existingTeams = await requestLocalData<EventTeam[]>(`/api/${COLLECTION}`);
  if (existingTeams.some((team) => team.id !== currentTeamId && team.workspaceId === workspaceId && team.projectId === projectId && ids.some((id) => team.participantIds.includes(id)))) {
    throw new Error("This participant is already assigned to another team.");
  }
  return records as EventParticipant[];
}

export async function createEventTeam(data: Omit<EventTeam, "id" | "createdAt" | "updatedAt">, ownerId = actor()): Promise<EventTeam> {
  if (!data.name.trim()) throw new Error("Team name is required.");
  const participants = await verifyParticipants(data.participantIds, data.projectId, data.workspaceId, ownerId);
  if (data.leaderParticipantId && !participants.some((item) => item.id === data.leaderParticipantId)) {
    throw new Error("The team leader must be a member of this team.");
  }
  const team = await requestLocalData<EventTeam>(`/api/${COLLECTION}`, {
    method: "POST",
    body: JSON.stringify({ ...data, name: data.name.trim() }),
  });
  await Promise.all(data.participantIds.map((participantId) => {
    const participant = participants.find((item) => item.id === participantId);
    return participant
      ? requestLocalData(`/api/${PARTICIPANTS}/${encodeURIComponent(participantId)}`, {
          method: "PATCH",
          body: JSON.stringify({ teamId: team.id }),
        })
      : Promise.resolve();
  }));
  await emitActivityEvent({ ownerId, projectId: data.projectId, entityType: "project", entityId: team.id, entityName: team.name, action: "created", description: `Created event team "${team.name}".` });
  return team;
}

export async function updateEventTeam(
  teamId: string,
  projectId: string,
  workspaceId: string,
  data: Partial<Pick<EventTeam, "name" | "description" | "leaderParticipantId" | "participantIds" | "status">>,
  ownerId = actor(),
): Promise<EventTeam> {
  const current = await getEventTeam(teamId, projectId, workspaceId, ownerId);
  if (!current) throw new Error("Team not found in this event.");
  const memberIds = data.participantIds ?? current.participantIds;
  const validatedParticipants = await verifyParticipants(memberIds, projectId, workspaceId, ownerId, teamId);
  const leaderId = data.leaderParticipantId ?? current.leaderParticipantId;
  if (leaderId && !validatedParticipants.some((item) => item.id === leaderId)) throw new Error("The team leader must be a member of this team.");

  const updated = { ...current, ...omitUndefinedFields(data), participantIds: memberIds, updatedAt: new Date().toISOString() };
  await requestLocalData<EventTeam>(`/api/${COLLECTION}/${encodeURIComponent(teamId)}`, {
    method: "PATCH",
    body: JSON.stringify({ ...omitUndefinedFields(data), participantIds: memberIds }),
  });
  const changed = new Set([...current.participantIds, ...memberIds]);
  const allParticipants = await requestLocalData<EventParticipant[]>(`/api/${PARTICIPANTS}`);
  await Promise.all(allParticipants.filter((participant) => changed.has(participant.id)).map((participant) =>
    requestLocalData(`/api/${PARTICIPANTS}/${encodeURIComponent(participant.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ teamId: memberIds.includes(participant.id) ? teamId : null }),
    }),
  ));
  await emitActivityEvent({ ownerId, projectId, entityType: "project", entityId: teamId, entityName: updated.name, action: data.status === "confirmed" ? "status_changed" : "updated", description: data.status === "confirmed" ? `Confirmed event team "${updated.name}".` : `Updated event team "${updated.name}".` });
  return updated;
}

export async function deleteEventTeam(teamId: string, projectId: string, workspaceId: string, ownerId = actor()): Promise<void> {
  const team = await getEventTeam(teamId, projectId, workspaceId, ownerId);
  if (!team) throw new Error("Team not found in this event.");
  await requestLocalData<{ deleted: boolean }>(`/api/${COLLECTION}/${encodeURIComponent(teamId)}`, { method: "DELETE" });
  const participants = await requestLocalData<EventParticipant[]>(`/api/${PARTICIPANTS}`);
  await Promise.all(participants.filter((participant) => participant.teamId === teamId).map((participant) =>
    requestLocalData(`/api/${PARTICIPANTS}/${encodeURIComponent(participant.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ teamId: null }),
    }),
  ));
  await emitActivityEvent({ ownerId, projectId, entityType: "project", entityId: teamId, entityName: team.name, action: "deleted", description: `Removed event team "${team.name}".` });
}

export async function addParticipantToTeam(teamId: string, participantId: string, projectId: string, workspaceId: string, ownerId = actor()): Promise<EventTeam> {
  const team = await getEventTeam(teamId, projectId, workspaceId, ownerId);
  if (!team) throw new Error("Team not found in this event.");
  if (team.participantIds.includes(participantId)) throw new Error("This participant is already in the team.");
  await verifyParticipants([participantId], projectId, workspaceId, ownerId);
  return updateEventTeam(teamId, projectId, workspaceId, { participantIds: [...team.participantIds, participantId] }, ownerId);
}

export async function removeParticipantFromTeam(teamId: string, participantId: string, projectId: string, workspaceId: string, ownerId = actor()): Promise<EventTeam> {
  const team = await getEventTeam(teamId, projectId, workspaceId, ownerId);
  if (!team) throw new Error("Team not found in this event.");
  return updateEventTeam(teamId, projectId, workspaceId, {
    participantIds: team.participantIds.filter((id) => id !== participantId),
    ...(team.leaderParticipantId === participantId ? { leaderParticipantId: undefined } : {}),
  }, ownerId);
}
