import { CHANGE_STATUSES } from "@/lib/constants/changes";
import type { ChangeStatus } from "@/types";

const styles: Record<ChangeStatus, string> = {
  new: "border-slate-200 bg-slate-50 text-slate-700",
  under_review: "border-amber-200 bg-amber-50 text-amber-900",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  implemented: "border-blue-200 bg-blue-50 text-blue-800",
  cancelled: "border-slate-200 bg-slate-100 text-slate-600",
};

export function ChangeStatusBadge({ status }: { status: ChangeStatus }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}>{CHANGE_STATUSES.find((item) => item.value === status)?.label ?? status}</span>;
}
