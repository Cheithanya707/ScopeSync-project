import type { CalendarEventType, ChangeStatus, TaskStatus } from "@/types";

export const CALENDAR_EVENT_TYPES: { value: CalendarEventType; label: string }[] = [
  { value: "project_deadline", label: "Project Deadline" },
  { value: "task_due", label: "Task Due" },
  { value: "change_requested", label: "Change Requested" },
  { value: "payment_due", label: "Payment Due" },
  { value: "event_schedule", label: "Event Schedule" },
];

export const CALENDAR_VIEWS = ["month", "week", "day"] as const;
export type CalendarViewMode = (typeof CALENDAR_VIEWS)[number];

export const CALENDAR_TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const CALENDAR_CHANGE_STATUSES: { value: ChangeStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "implemented", label: "Implemented" },
  { value: "cancelled", label: "Cancelled" },
];
