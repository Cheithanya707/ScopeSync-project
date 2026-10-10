import type { ProjectShareStatus } from "@/types";

const labels: Record<ProjectShareStatus, string> = { pending: "Pending", active: "Active", revoked: "Revoked" };
const styles: Record<ProjectShareStatus, string> = {
  pending: "bg-amber-50 text-amber-800",
  active: "bg-emerald-50 text-emerald-800",
  revoked: "bg-slate-100 text-slate-600",
};

export function ShareStatusBadge({ status }: { status: ProjectShareStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
}
