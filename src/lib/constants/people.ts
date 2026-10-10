import type { WorkspaceMemberRole, WorkspaceMemberStatus } from "@/types";

export const MEMBER_ROLES: { value: WorkspaceMemberRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "project_manager", label: "Project Manager" },
  { value: "team_member", label: "Team Member" },
  { value: "designer", label: "Designer" },
  { value: "developer", label: "Developer" },
  { value: "content_writer", label: "Content Writer" },
  { value: "marketer", label: "Marketer" },
  { value: "event_manager", label: "Event Manager" },
  { value: "faculty", label: "Faculty" },
  { value: "student", label: "Student" },
  { value: "other", label: "Other" },
];

export const MEMBER_STATUSES: { value: WorkspaceMemberStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
  { value: "inactive", label: "Inactive" },
];

export function memberRoleLabel(role: WorkspaceMemberRole): string {
  return MEMBER_ROLES.find((item) => item.value === role)?.label ?? "Other";
}

export function memberStatusLabel(status: WorkspaceMemberStatus): string {
  return MEMBER_STATUSES.find((item) => item.value === status)?.label ?? "Inactive";
}
