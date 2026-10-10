"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { isLocalDataAvailable } from "@/lib/localData";
import { getNotificationRoute } from "@/lib/utils/notificationUtils";
import {
  getUnreadNotifications,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/local/notificationService";
import type { Notification } from "@/types";

type NotificationFilter = "all" | "unread";

export default function NotificationsPage() {
  const { user } = useAuth();
  const workspace = useWorkspace();
  const router = useRouter();
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(isLocalDataAvailable);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const refresh = useCallback(async () => {
    if (!isLocalDataAvailable || !user || !workspace.workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setItems(await (filter === "unread"
        ? getUnreadNotifications(workspace.workspaceId, user.uid, 100)
        : getUserNotifications(workspace.workspaceId, user.uid, 100)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Notifications could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filter, user, workspace.workspaceId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  const visibleItems = items;

  const open = async (notification: Notification) => {
    if (!user) return;
    setActionError("");
    try {
      if (!notification.read) await markNotificationAsRead(notification.id);
      setItems((current) => filter === "unread"
        ? current.filter((item) => item.id !== notification.id)
        : current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
      const route = getNotificationRoute(notification);
      if (route) router.push(route);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Notification could not be opened.");
    }
  };

  const markAll = async () => {
    if (!user || !workspace.workspaceId) return;
    setMarkingAll(true);
    setActionError("");
    try {
      await markAllNotificationsAsRead(workspace.workspaceId, user.uid);
      setItems((current) => filter === "unread" ? [] : current.map((item) => ({ ...item, read: true })));
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Notifications could not all be marked as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = filter === "unread" ? items.length : items.filter((item) => !item.read).length;
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">Workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Notifications</h1>
          <p className="mt-2 text-sm text-muted-foreground">Updates and reminders that need your attention.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void markAll()} disabled={!unreadCount || markingAll || loading || !isLocalDataAvailable}>
          <CheckCheck aria-hidden="true" className="size-4" />Mark all as read
        </Button>
      </div>

      <div className="mt-6 flex gap-2 border-b border-slate-200">
        {(["all", "unread"] as const).map((value) => (
          <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${filter === value ? "border-brand text-brand" : "border-transparent text-slate-600 hover:text-slate-900"}`}>
            {value === "all" ? "All" : `Unread${unreadCount ? ` (${unreadCount})` : ""}`}
          </button>
        ))}
      </div>

      {actionError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{actionError}</p>}
      {!isLocalDataAvailable ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Notifications are saved only in this browser.</p>
      ) : workspace.loading || loading ? (
        <div role="status" aria-label="Loading notifications" className="mt-5 space-y-3 rounded-xl border border-border bg-white p-5">{[0, 1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-lg bg-slate-100" />)}</div>
      ) : workspace.error || error ? (
        <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">{workspace.error || error}</p>
      ) : visibleItems.length ? (
        <section aria-label={`${filter === "unread" ? "Unread " : ""}notifications`} className="mt-5 space-y-2 rounded-xl border border-border bg-white p-3 sm:p-4">
          {visibleItems.map((notification) => <NotificationItem key={notification.id} notification={notification} onSelect={open} />)}
          {items.length === 100 && <p className="px-3 py-2 text-center text-xs text-muted-foreground">Showing the 100 most recent notifications.</p>}
        </section>
      ) : (
        <section className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <Inbox aria-hidden="true" className="mx-auto size-8 text-slate-400" />
          <h2 className="mt-3 font-semibold text-slate-900">{filter === "unread" ? "No unread notifications" : "You're all caught up"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{filter === "unread" ? "You have no notifications waiting for you." : "No new notifications."}</p>
        </section>
      )}
    </div>
  );
}
