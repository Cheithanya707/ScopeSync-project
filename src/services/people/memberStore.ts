import { emitActivityEvent } from "@/lib/activityEvents";
import { requestLocalData, resolveWorkspaceId } from "@/lib/localData";
import { getProject, getProjects } from "@/services/projects/projectStore";
import { removeWorkspaceAssignee } from "@/services/tasks/taskStore";
import type { Project, WorkspaceMember, WorkspaceMemberRole, WorkspaceMemberStatus } from "@/types";

export type WorkspaceMemberInput = {
  userId?: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: WorkspaceMemberRole;
  status: WorkspaceMemberStatus;
};

function membersPath(workspaceId: string): string {
  return `/api/workspaces/${encodeURIComponent(workspaceId)}/members`;
}

function memberPath(workspaceId: string, memberId: string): string {
  return `${membersPath(workspaceId)}/${encodeURIComponent(memberId)}`;
}

export async function getWorkspaceMembers(ownerId: string, workspaceId: string | null | undefined): Promise<WorkspaceMember[]> {
  const actualWorkspaceId = await resolveWorkspaceId(ownerId, workspaceId);
  if (!actualWorkspaceId) return [];
  const members = await requestLocalData<WorkspaceMember[]>(membersPath(actualWorkspaceId));
  return members.sort((left, right) => left.displayName.localeCompare(right.displayName));
}

export async function getWorkspaceMember(
  ownerId: string,
  workspaceId: string | null | undefined,
  memberId: string,
): Promise<WorkspaceMember | null> {
  const actualWorkspaceId = await resolveWorkspaceId(ownerId, workspaceId);
  if (!actualWorkspaceId) return null;
  return (await getWorkspaceMembers(ownerId, actualWorkspaceId)).find((member) => member.id === memberId) ?? null;
}

export async function createWorkspaceMember(
  ownerId: string,
  workspaceId: string | null | undefined,
  input: WorkspaceMemberInput,
): Promise<WorkspaceMember> {
  const actualWorkspaceId = await resolveWorkspaceId(ownerId, workspaceId);
  if (!actualWorkspaceId) throw new Error("Complete workspace setup before inviting people.");
  const displayName = input.displayName.trim();
  const email = input.email.trim().toLowerCase();
  if (!displayName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a name and a valid email address.");
  }
  const member = await requestLocalData<WorkspaceMember>(membersPath(actualWorkspaceId), {
    method: "POST",
    body: JSON.stringify({
      email,
      displayName,
      ...(input.photoURL ? { photoURL: input.photoURL.trim() } : {}),
      role: input.role,
      status: input.status,
    }),
  });
  await emitActivityEvent({
    ownerId,
    entityType: "member",
    entityId: member.id,
    entityName: member.displayName,
    action: member.status === "invited" ? "invited" : "created",
    description: member.status === "invited"
      ? `Invited ${member.displayName} to the workspace.`
      : `Added ${member.displayName} to the workspace.`,
  });
  return member;
}

export async function updateWorkspaceMember(
  ownerId: string,
  workspaceId: string | null | undefined,
  memberId: string,
  updates: Partial<Pick<WorkspaceMember, "displayName" | "role" | "status" | "email" | "photoURL">>,
): Promise<WorkspaceMember> {
  const actualWorkspaceId = await resolveWorkspaceId(ownerId, workspaceId);
  if (!actualWorkspaceId) throw new Error("Complete workspace setup before updating members.");
  const updated = await requestLocalData<WorkspaceMember>(memberPath(actualWorkspaceId, memberId), {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  await emitActivityEvent({
    ownerId,
    entityType: "member",
    entityId: updated.id,
    entityName: updated.displayName,
    action: "updated",
    description: `Updated workspace member ${updated.displayName}.`,
  });
  return updated;
}

export async function deleteWorkspaceMember(ownerId: string, workspaceId: string | null | undefined, memberId: string): Promise<void> {
  const actualWorkspaceId = await resolveWorkspaceId(ownerId, workspaceId);
  if (!actualWorkspaceId) throw new Error("Complete workspace setup before removing members.");
  const member = await getWorkspaceMember(ownerId, actualWorkspaceId, memberId);
  if (!member) throw new Error("This person is not available in the current workspace.");
  await requestLocalData<{ deleted: boolean }>(memberPath(actualWorkspaceId, memberId), { method: "DELETE" });
  await removeWorkspaceAssignee(ownerId, actualWorkspaceId, [member.id, member.userId].filter((id): id is string => Boolean(id)));
  await emitActivityEvent({
    ownerId,
    entityType: "member",
    entityId: member.id,
    entityName: member.displayName,
    action: "removed",
    description: `Removed ${member.displayName} from the workspace.`,
  });
}

export async function assignMemberToProject(
  ownerId: string,
  workspaceId: string | null | undefined,
  memberId: string,
  projectId: string,
): Promise<WorkspaceMember> {
  const actualWorkspaceId = await resolveWorkspaceId(ownerId, workspaceId);
  if (!actualWorkspaceId) throw new Error("Complete workspace setup before assigning people.");
  const project = await getProject(ownerId, actualWorkspaceId, projectId);
  if (!project || project.workspaceId !== actualWorkspaceId) throw new Error("This project is not available in the current workspace.");
  const member = await getWorkspaceMember(ownerId, actualWorkspaceId, memberId);
  if (!member) throw new Error("This person is not available in the current workspace.");
  if (member.projectIds.includes(projectId)) return member;
  return updateProjectIds(ownerId, actualWorkspaceId, member, [...member.projectIds, projectId], project.name);
}

export async function removeMemberFromProject(
  ownerId: string,
  workspaceId: string | null | undefined,
  memberId: string,
  projectId: string,
): Promise<WorkspaceMember> {
  const actualWorkspaceId = await resolveWorkspaceId(ownerId, workspaceId);
  if (!actualWorkspaceId) throw new Error("Complete workspace setup before removing people.");
  const project = await getProject(ownerId, actualWorkspaceId, projectId);
  if (!project || project.workspaceId !== actualWorkspaceId) throw new Error("This project is not available in the current workspace.");
  const member = await getWorkspaceMember(ownerId, actualWorkspaceId, memberId);
  if (!member) throw new Error("This person is not available in the current workspace.");
  return updateProjectIds(ownerId, actualWorkspaceId, member, member.projectIds.filter((id) => id !== projectId), project.name);
}

export async function getProjectMembers(
  _ownerId: string,
  _workspaceId: string | null | undefined,
  projectId: string,
): Promise<WorkspaceMember[]> {
  return requestLocalData<WorkspaceMember[]>(`/api/projects/${encodeURIComponent(projectId)}/members`);
}

export async function getProjectsWithTeams(ownerId: string, workspaceId: string | null | undefined): Promise<Project[]> {
  const [projects, members] = await Promise.all([
    getProjects(ownerId, workspaceId),
    getWorkspaceMembers(ownerId, workspaceId),
  ]);
  const teamProjectIds = new Set(members.flatMap((member) => member.projectIds));
  return projects.filter((project) => teamProjectIds.has(project.id));
}

async function updateProjectIds(
  ownerId: string,
  workspaceId: string,
  member: WorkspaceMember,
  projectIds: string[],
  projectName: string,
): Promise<WorkspaceMember> {
  const updated = await requestLocalData<WorkspaceMember>(memberPath(workspaceId, member.id), {
    method: "PATCH",
    body: JSON.stringify({ projectIds: [...new Set(projectIds)] }),
  });
  const assigned = updated.projectIds.some((id) => !member.projectIds.includes(id));
  const affectedProjectId = projectIds.find((id) => !member.projectIds.includes(id))
    ?? member.projectIds.find((id) => !projectIds.includes(id));
  if (!affectedProjectId) return updated;
  await emitActivityEvent({
    ownerId,
    projectId: affectedProjectId,
    entityType: "member",
    entityId: updated.id,
    entityName: updated.displayName,
    action: assigned ? "assigned" : "unassigned",
    description: assigned
      ? `Added ${updated.displayName} to a project team.`
      : `Removed ${updated.displayName} from a project team.`,
    metadata: { projectName },
  });
  return updated;
}
