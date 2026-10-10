import { TASK_STATUSES } from "@/lib/constants/tasks";
import type { TaskStatus } from "@/types";

const styles: Record<TaskStatus, string> = {
  todo: "border-slate-200 bg-slate-50 text-slate-700",
  in_progress: "border-blue-200 bg-blue-50 text-blue-800",
  blocked: "border-amber-200 bg-amber-50 text-amber-900",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-slate-200 bg-slate-100 text-slate-600",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}>{TASK_STATUSES.find((item) => item.value === status)?.label ?? status}</span>;
}
