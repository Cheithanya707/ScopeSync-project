import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CreditCard,
  FileText,
  FolderKanban,
  ListTodo,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { Notification, NotificationPriority, NotificationType } from "@/types";

const notificationIcons: Record<NotificationType, LucideIcon> = {
  task_assigned: ListTodo,
  task_due: CalendarClock,
  task_overdue: AlertTriangle,
  scope_change: AlertTriangle,
  requirement_update: FileText,
  payment_due: CreditCard,
  project_update: FolderKanban,
  document_update: FileText,
  team_update: UsersRound,
  general: Bell,
};

export function getNotificationIcon(type: NotificationType): LucideIcon {
  return notificationIcons[type];
}

export function getNotificationRoute(notification: Pick<Notification, "actionUrl" | "projectId" | "entityType" | "entityId">): string | null {
  if (
    notification.actionUrl?.startsWith("/") &&
    !notification.actionUrl.startsWith("//") &&
    !notification.actionUrl.includes("\\") &&
    !/[\r\n]/.test(notification.actionUrl)
  ) return notification.actionUrl;
  if (!notification.entityType || !notification.entityId) return null;
  const projectId = notification.projectId;
  switch (notification.entityType) {
    case "project":
      return `/projects/${encodeURIComponent(notification.entityId)}`;
    case "task":
      return projectId ? `/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(notification.entityId)}` : null;
    case "requirement":
      return projectId ? `/projects/${encodeURIComponent(projectId)}/requirements` : null;
    case "scope_change":
      return projectId ? `/projects/${encodeURIComponent(projectId)}/changes/${encodeURIComponent(notification.entityId)}` : null;
    case "payment":
      return projectId ? `/projects/${encodeURIComponent(projectId)}/payments/${encodeURIComponent(notification.entityId)}` : null;
    case "document":
      return projectId ? `/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(notification.entityId)}` : null;
    case "member":
      return `/people/${encodeURIComponent(notification.entityId)}`;
    case "workspace":
    case "calendar":
      return null;
  }
}

export function getNotificationPriorityLabel(priority: NotificationPriority): string {
  return {
    low: "Low priority",
    normal: "Normal priority",
    high: "High priority",
    critical: "Critical priority",
  }[priority];
}
