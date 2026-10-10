import { createElement } from "react";
import type { Notification } from "@/types";
import { formatActivityTime } from "@/lib/utils/activityUtils";
import { getNotificationIcon, getNotificationPriorityLabel } from "@/lib/utils/notificationUtils";

export function NotificationItem({
  notification,
  onSelect,
  compact = false,
}: {
  notification: Notification;
  onSelect: (notification: Notification) => void;
  compact?: boolean;
}) {
  const Icon = getNotificationIcon(notification.type);
  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      aria-label={`${notification.read ? "Read" : "Unread"} notification: ${notification.title}`}
      className={`flex w-full gap-3 rounded-lg p-3 text-left transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${notification.read ? "bg-white" : "bg-blue-50/50"}`}
    >
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${notification.priority === "critical" || notification.priority === "high" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
        {createElement(Icon, { "aria-hidden": true, className: "size-4" })}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-slate-900">{notification.title}</span>
          {!notification.read && <span className="mt-1 size-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
        </span>
        <span className="mt-1 block text-sm leading-5 text-slate-600">{notification.message}</span>
        <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{formatActivityTime(notification.createdAt)}</span>
          {!compact && <><span aria-hidden="true">·</span><span>{getNotificationPriorityLabel(notification.priority)}</span></>}
        </span>
      </span>
    </button>
  );
}
