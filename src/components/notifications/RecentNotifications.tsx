"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Notification } from "@/types";
import { getUserNotifications, markNotificationAsRead } from "@/services/local/notificationService";
import { getNotificationRoute } from "@/lib/utils/notificationUtils";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { isLocalDataAvailable } from "@/lib/localData";

export function RecentNotifications({ workspaceId, userId, limit = 5 }: { workspaceId: string; userId: string; limit?: number }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(isLocalDataAvailable);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLocalDataAvailable) return;
    let current = true;
    const timeoutId = window.setTimeout(() => {
      void getUserNotifications(workspaceId, userId, limit)
        .then((items) => { if (current) setNotifications(items); })
        .catch((cause: unknown) => { if (current) setError(cause instanceof Error ? cause.message : "Notifications could not be loaded."); })
        .finally(() => { if (current) setLoading(false); });
    }, 0);
    return () => { current = false; window.clearTimeout(timeoutId); };
  }, [workspaceId, userId, limit]);

  const open = async (notification: Notification) => {
    try {
      if (!notification.read) await markNotificationAsRead(notification.id);
      const route = getNotificationRoute(notification);
      if (route) router.push(route);
      else setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Notification could not be opened.");
    }
  };

  if (!isLocalDataAvailable) return <p className="text-sm text-muted-foreground">Notifications are available from the backend when your workspace is configured.</p>;
  if (loading) return <div role="status" aria-label="Loading notifications" className="space-y-2">{[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-slate-100" />)}</div>;
  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>;
  if (!notifications.length) return <p className="rounded-lg bg-slate-50 p-4 text-sm text-muted-foreground">You’re all caught up. No new notifications.</p>;

  return <div className="space-y-1">{notifications.map((notification) => <NotificationItem key={notification.id} notification={notification} onSelect={open} compact />)}</div>;
}
