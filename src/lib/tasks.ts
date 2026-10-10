import { TASK_PRIORITIES } from "@/lib/constants/tasks";
import { localDateKey, parseDateOnly } from "@/lib/dates";
import type { Task, TaskStatus } from "@/types";

export function dueDateLabel(value?: string, status?: TaskStatus): { label: string; overdue: boolean } {
  if (!value) return { label: "No due date", overdue: false };
  const due = parseDateOnly(value);
  if (!due) return { label: "Not set", overdue: false };
  const dueKey = localDateKey(due);
  const todayKey = localDateKey();
  if (dueKey < todayKey) return {
    label: `Due ${new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(due)}`,
    overdue: status !== "completed" && status !== "cancelled",
  };
  if (dueKey === todayKey) return { label: "Due Today", overdue: false };
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dueKey === localDateKey(tomorrow)) return { label: "Due Tomorrow", overdue: false };
  return { label: `Due ${new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(due)}`, overdue: false };
}

export function compareTaskPriority(a: Task, b: Task): number {
  const aRank = TASK_PRIORITIES.find((item) => item.value === a.priority)?.rank ?? 0;
  const bRank = TASK_PRIORITIES.find((item) => item.value === b.priority)?.rank ?? 0;
  return bRank - aRank;
}
