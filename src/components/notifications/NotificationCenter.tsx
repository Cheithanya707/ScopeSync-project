"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import type { Notification } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { isLocalDataAvailable } from "@/lib/localData";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToUnreadNotificationCount,
  subscribeToUserNotifications,
} from "@/services/local/notificationService";
import { getNotificationRoute } from "@/lib/utils/notificationUtils";
import { NotificationItem } from "@/components/notifications/NotificationItem";

export function NotificationCenter({ placement = "header" }: { placement?: "header" | "sidebar" }) {
  const { user } = useAuth();
  const workspace = useWorkspace();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [countCapped, setCountCapped] = useState(false);
  const [loading, setLoading] = useState(isLocalDataAvailable);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const totalUnreadCount = unreadCount;

  useEffect(() => {
    const workspaceId = workspace.workspaceId;
    if (!isLocalDataAvailable || !user || !workspaceId) {
      const timeoutId = window.setTimeout(() => setLoading(false), 0);
      return () => window.clearTimeout(timeoutId);
    }
    let current = true;
    const handleError = (cause: Error) => { if (current) setError(cause.message); };
    const timeoutId = window.setTimeout(() => {
      try {
        const stopItems = subscribeToUserNotifications(
          workspaceId,
          user.uid,
          (next) => { if (current) { setItems(next); setLoading(false); } },
          handleError,
          5,
        );
        const stopCount = subscribeToUnreadNotificationCount(
          workspaceId,
          user.uid,
          (count, capped) => { if (current) { setUnreadCount(count); setCountCapped(capped); } },
          handleError,
        );
        cleanup = () => { stopItems(); stopCount(); };
      } catch (cause) {
        handleError(cause instanceof Error ? cause : new Error("Notifications could not be loaded."));
        setLoading(false);
      }
    }, 0);
    let cleanup = () => {};
    return () => { current = false; window.clearTimeout(timeoutId); cleanup(); };
  }, [user, workspace.workspaceId]);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const selectNotification = async (notification: Notification) => {
    if (!user) return;
    setActionError("");
    try {
      if (!notification.read) await markNotificationAsRead(notification.id);
      setOpen(false);
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
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Notifications could not be marked as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={`Notifications${totalUnreadCount ? `, ${countCapped ? `${unreadCount}+` : totalUnreadCount} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => { setOpen((value) => !value); setActionError(""); }}
        className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Bell aria-hidden="true" className="size-5" />
        {totalUnreadCount > 0 && <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-none text-white">{countCapped ? `${unreadCount}+` : totalUnreadCount}</span>}
        {loading && isLocalDataAvailable && <span role="status" aria-label="Loading unread count" className="absolute -right-0.5 -top-0.5 size-2 animate-pulse rounded-full bg-slate-300" />}
      </button>
      {open && (
        <section role="dialog" aria-label="Notifications" className={`absolute z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-white shadow-xl ${placement === "sidebar" ? "bottom-0 left-0" : "right-0 mt-2"}`}>
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div><h2 className="text-sm font-semibold text-slate-950">Notifications</h2><p className="text-xs text-muted-foreground">{totalUnreadCount ? `${totalUnreadCount} unread` : "All caught up"}</p></div>
            {unreadCount > 0 && <button type="button" onClick={() => void markAll()} disabled={markingAll} className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline disabled:opacity-50"><CheckCheck aria-hidden="true" className="size-3.5" />Mark all as read</button>}
          </header>
          {actionError && <p role="alert" className="mx-3 mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-800">{actionError}</p>}
          {!isLocalDataAvailable ? (
            <p className="p-5 text-sm text-muted-foreground">Notifications are stored by the backend.</p>
          ) : workspace.loading || loading ? (
            <div role="status" aria-label="Loading notifications" className="space-y-2 p-3">{[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-slate-100" />)}</div>
          ) : workspace.error || error ? (
            <p role="alert" className="m-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{workspace.error || error}</p>
          ) : !items.length ? (
            <p className="p-5 text-sm text-muted-foreground">You are all caught up. No new notifications.</p>
          ) : (
            <div className="max-h-[min(65vh,28rem)] overflow-y-auto p-2">
              {items.map((notification) => <NotificationItem key={notification.id} notification={notification} onSelect={selectNotification} compact />)}
            </div>
          )}
          <footer className="border-t border-slate-100 p-3 text-center">
            <Link href="/notifications" onClick={() => setOpen(false)} className="text-sm font-medium text-brand hover:underline">View all notifications</Link>
          </footer>
        </section>
      )}
    </div>
  );
}
