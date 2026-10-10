import {
  CheckCircle2,
  Clock3,
  CreditCard,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  UserPlus,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { Activity, ActivityAction, ActivityEntityType } from "@/types";

const actionIcons: Record<ActivityAction, LucideIcon> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  completed: CheckCircle2,
  assigned: UserPlus,
  unassigned: UserPlus,
  approved: CheckCircle2,
  rejected: XCircle,
  submitted: Clock3,
  uploaded: Upload,
  paid: CreditCard,
  invited: UserPlus,
  removed: Trash2,
  status_changed: RefreshCw,
};

const entityLabels: Record<ActivityEntityType, string> = {
  workspace: "Workspace",
  project: "Projects",
  requirement: "Requirements",
  task: "Tasks",
  scope_change: "Changes",
  document: "Documents",
  payment: "Payments",
  member: "People",
  calendar: "Calendar",
};

export function formatActivityDescription(activity: Activity): string {
  if (activity.description.trim()) return activity.description;
  return `${activity.actorName} ${getActivityLabel(activity.action).toLowerCase()} ${activity.entityType.replace("_", " ")} "${activity.entityName}"`;
}

export function getActivityIcon(action: ActivityAction): LucideIcon {
  return actionIcons[action];
}

export function getActivityLabel(action: ActivityAction): string {
  return action.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getActivityEntityLabel(entityType: ActivityEntityType): string {
  return entityLabels[entityType];
}

export function getActivityRoute(activity: Pick<Activity, "entityType" | "entityId" | "projectId">): string | null {
  const projectId = activity.projectId;
  switch (activity.entityType) {
    case "project":
      return `/projects/${encodeURIComponent(activity.entityId)}`;
    case "task":
      return projectId ? `/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(activity.entityId)}` : null;
    case "scope_change":
      return projectId ? `/projects/${encodeURIComponent(projectId)}/changes/${encodeURIComponent(activity.entityId)}` : null;
    case "payment":
      return projectId ? `/projects/${encodeURIComponent(projectId)}/payments/${encodeURIComponent(activity.entityId)}` : null;
    case "document":
      return projectId ? `/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(activity.entityId)}` : null;
    case "requirement":
      return projectId ? `/projects/${encodeURIComponent(projectId)}/requirements` : null;
    case "member":
      return `/people/${encodeURIComponent(activity.entityId)}`;
    case "workspace":
    case "calendar":
      return null;
  }
}

export function getActivityDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function getActivityDateGroup(value: unknown, now = new Date()): "Today" | "Yesterday" | "Earlier This Week" | "Older" {
  const date = getActivityDate(value);
  if (!date) return "Older";
  const startOfDay = (item: Date) => new Date(item.getFullYear(), item.getMonth(), item.getDate()).getTime();
  const daysAgo = Math.floor((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return "Earlier This Week";
  return "Older";
}

export function formatActivityTime(value: unknown): string {
  const date = getActivityDate(value);
  if (!date) return "Time unavailable";
  const elapsed = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}
