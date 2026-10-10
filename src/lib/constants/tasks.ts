import type { TaskPriority, TaskStatus, TaskType } from "@/types";

export const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: "development", label: "Development" },
  { value: "design", label: "Design" },
  { value: "research", label: "Research" },
  { value: "content", label: "Content" },
  { value: "testing", label: "Testing" },
  { value: "review", label: "Review" },
  { value: "communication", label: "Communication" },
  { value: "documentation", label: "Documentation" },
  { value: "planning", label: "Planning" },
  { value: "marketing", label: "Marketing" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string; rank: number }[] = [
  { value: "low", label: "Low", rank: 1 },
  { value: "medium", label: "Medium", rank: 2 },
  { value: "high", label: "High", rank: 3 },
  { value: "critical", label: "Critical", rank: 4 },
];

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];
