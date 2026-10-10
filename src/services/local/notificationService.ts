import { getLocalUserId, requestLocalData } from "@/lib/localData";
import type { ActivityEntityType, Notification, NotificationPriority, NotificationType } from "@/types";

const PAGE_LIMIT = 100;
const MAX_LISTENER_NOTIFICATIONS = 250;
const TYPES = new Set<NotificationType>(["task_assigned", "task_due", "task_overdue", "scope_change", "requirement_update", "payment_due", "project_update", "document_update", "team_update", "general"]);
const PRIORITIES = new Set<NotificationPriority>(["low", "normal", "high", "critical"]);
const ENTITY_TYPES = new Set<ActivityEntityType>(["workspace", "project", "requirement", "task", "scope_change", "document", "payment", "member", "calendar"]);

function assertCurrentUser(userId: string): void {
  if (getLocalUserId() !== userId) throw new Error("You can only access your own notifications.");
}

function validateNotification(data: Omit<Notification, "id" | "createdAt" | "readAt">): void {
  if (!data.workspaceId.trim() || !data.userId.trim() || !data.title.trim() || !data.message.trim()) {
    throw new Error("Notification is missing required details.");
  }
  if (!TYPES.has(data.type) || !PRIORITIES.has(data.priority)) {
    throw new Error("Notification type or priority is invalid.");
  }
  if (data.entityType && !ENTITY_TYPES.has(data.entityType)) {
    throw new Error("Notification entity type is invalid.");
  }
}

async function notifications(): Promise<Notification[]> {
  return requestLocalData<Notification[]>("/api/notifications");
}

export async function createNotification(
  data: Omit<Notification, "id" | "createdAt" | "readAt" | "read">,
): Promise<string> {
  validateNotification({ ...data, read: false });
  const notification = await requestLocalData<Notification>("/api/notifications", {
    method: "POST",
    body: JSON.stringify({ ...data, read: false }),
  });
  return notification.id;
}

async function queryUserNotifications(
  workspaceId: string,
  userId: string,
  unreadOnly: boolean,
  resultLimit: number,
): Promise<Notification[]> {
  assertCurrentUser(userId);
  return (await notifications())
    .filter((item) => item.workspaceId === workspaceId && item.userId === userId && (!unreadOnly || !item.read))
    .sort((left, right) => String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? "")))
    .slice(0, Math.max(1, Math.min(Math.floor(resultLimit), PAGE_LIMIT)));
}

export async function getUserNotifications(
  workspaceId: string,
  userId: string,
  resultLimit = PAGE_LIMIT,
): Promise<Notification[]> {
  return queryUserNotifications(workspaceId, userId, false, resultLimit);
}

export async function getUnreadNotifications(
  workspaceId: string,
  userId: string,
  resultLimit = PAGE_LIMIT,
): Promise<Notification[]> {
  return queryUserNotifications(workspaceId, userId, true, resultLimit);
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const userId = getLocalUserId();
  const items = await notifications();
  const notification = items.find((item) => item.id === notificationId && item.userId === userId);
  if (!notification) throw new Error("This notification is unavailable.");
  if (notification.read) return;
  await requestLocalData<Notification>(`/api/notifications/${encodeURIComponent(notificationId)}`, {
    method: "PATCH",
    body: JSON.stringify({ read: true, readAt: new Date().toISOString() }),
  });
}

export async function markAllNotificationsAsRead(workspaceId: string, userId: string): Promise<void> {
  assertCurrentUser(userId);
  const items = await notifications();
  const now = new Date().toISOString();
  await Promise.all(items
    .filter((item) => item.workspaceId === workspaceId && item.userId === userId && !item.read)
    .map((item) => requestLocalData<Notification>(`/api/notifications/${encodeURIComponent(item.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ read: true, readAt: now }),
    })));
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const userId = getLocalUserId();
  const items = await notifications();
  if (!items.some((item) => item.id === notificationId && item.userId === userId)) {
    throw new Error("This notification is unavailable.");
  }
  await requestLocalData<{ deleted: boolean }>(`/api/notifications/${encodeURIComponent(notificationId)}`, {
    method: "DELETE",
  });
}

export async function getUnreadNotificationCount(workspaceId: string, userId: string): Promise<number> {
  return (await queryUserNotifications(workspaceId, userId, true, MAX_LISTENER_NOTIFICATIONS)).length;
}

function subscribe(
  update: () => Promise<void>,
  onError: (error: Error) => void,
): () => void {
  let active = true;
  let refreshing = false;
  const refresh = async () => {
    if (!active || refreshing) return;
    refreshing = true;
    try {
      await update();
    } catch (error) {
      if (active) onError(error instanceof Error ? error : new Error("Notifications could not be loaded."));
    } finally {
      refreshing = false;
    }
  };
  const timer = window.setInterval(refresh, 1000);
  window.addEventListener("storage", refresh);
  void refresh();
  return () => {
    active = false;
    window.clearInterval(timer);
    window.removeEventListener("storage", refresh);
  };
}

export function subscribeToUserNotifications(
  workspaceId: string,
  userId: string,
  onItems: (items: Notification[]) => void,
  onError: (error: Error) => void,
  resultLimit = 5,
): () => void {
  assertCurrentUser(userId);
  return subscribe(
    async () => onItems(await queryUserNotifications(workspaceId, userId, false, resultLimit)),
    onError,
  );
}

export function subscribeToUnreadNotificationCount(
  workspaceId: string,
  userId: string,
  onCount: (count: number, capped: boolean) => void,
  onError: (error: Error) => void,
): () => void {
  assertCurrentUser(userId);
  return subscribe(async () => {
    const count = (await notifications()).filter((item) =>
      item.workspaceId === workspaceId && item.userId === userId && !item.read,
    ).length;
    onCount(Math.min(count, MAX_LISTENER_NOTIFICATIONS), count >= MAX_LISTENER_NOTIFICATIONS);
  }, onError);
}
