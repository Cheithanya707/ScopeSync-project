import { CHANGE_PRIORITIES } from "@/lib/constants/changes";
import type { ChangePriority } from "@/types";

const styles: Record<ChangePriority, string> = {
  low: "border-slate-200 bg-slate-50 text-slate-600",
  medium: "border-blue-200 bg-blue-50 text-blue-800",
  high: "border-orange-200 bg-orange-50 text-orange-900",
  critical: "border-red-200 bg-red-50 text-red-800",
};

export function ChangePriorityBadge({ priority }: { priority: ChangePriority }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[priority]}`}>{CHANGE_PRIORITIES.find((item) => item.value === priority)?.label ?? priority}</span>;
}
