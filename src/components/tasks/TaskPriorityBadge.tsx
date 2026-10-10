import { TASK_PRIORITIES } from "@/lib/constants/tasks";
import type { TaskPriority } from "@/types";

const styles: Record<TaskPriority, string> = {
  low: "border-slate-200 bg-slate-50 text-slate-600",
  medium: "border-blue-200 bg-blue-50 text-blue-800",
  high: "border-orange-200 bg-orange-50 text-orange-900",
  critical: "border-red-200 bg-red-50 text-red-800",
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[priority]}`}>{TASK_PRIORITIES.find((item) => item.value === priority)?.label ?? priority}</span>;
}
