"use client";

import { Banknote, CalendarDays, ListTodo, Repeat2, Timer } from "lucide-react";
import { CALENDAR_EVENT_TYPES } from "@/lib/constants/calendar";
import type { CalendarEvent as CalendarEventData } from "@/types";

const icons = { project_deadline: CalendarDays, task_due: ListTodo, change_requested: Repeat2, payment_due: Banknote, event_schedule: Timer };

export function CalendarEvent({
  event,
  compact = false,
  onSelect,
}: {
  event: CalendarEventData;
  compact?: boolean;
  onSelect: (event: CalendarEventData) => void;
}) {
  const Icon = icons[event.type];
  const typeLabel = CALENDAR_EVENT_TYPES.find((item) => item.value === event.type)?.label ?? "Calendar item";
  const colorClass = event.type === "project_deadline" ? "bg-blue-50 text-blue-900" : event.type === "task_due" ? "bg-emerald-50 text-emerald-900" : event.type === "payment_due" ? "bg-amber-50 text-amber-950" : "bg-violet-50 text-violet-900";
  return <button type="button" onClick={() => onSelect(event)} aria-label={`${typeLabel}: ${event.title}, ${event.projectName}, ${event.date}`} className={`flex w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${colorClass}`}>
    <Icon aria-hidden={true} className="size-3.5 shrink-0" />
    <span className={`min-w-0 truncate ${compact ? "hidden sm:inline" : ""}`}>{event.title}</span>
    {compact && <span className="sr-only sm:hidden">{event.title}</span>}
  </button>;
}
