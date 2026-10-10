import { PROJECT_STATUSES } from "@/lib/constants";
import type { ProjectStatus } from "@/types";

const styles: Record<ProjectStatus, string> = {
  planning: "border-slate-200 bg-slate-50 text-slate-700",
  active: "border-blue-200 bg-blue-50 text-blue-800",
  on_hold: "border-amber-200 bg-amber-50 text-amber-900",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  archived: "border-slate-300 bg-slate-100 text-slate-600",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const label = PROJECT_STATUSES.find((item) => item.value === status)?.label ?? status;
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}>{label}</span>;
}
