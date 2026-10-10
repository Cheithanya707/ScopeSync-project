import { getPaymentDisplayStatus } from "@/lib/utils/paymentUtils";
import type { Payment, PaymentStatus } from "@/types";

const styles: Record<PaymentStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-900",
  overdue: "border-red-200 bg-red-50 text-red-900",
  cancelled: "border-slate-200 bg-slate-100 text-slate-700",
  refunded: "border-violet-200 bg-violet-50 text-violet-900",
};

const labels: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function PaymentStatusBadge({ payment, status }: { payment?: Payment; status?: PaymentStatus }) {
  const current = payment ? getPaymentDisplayStatus(payment) : status ?? "pending";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[current]}`}>{labels[current]}</span>;
}
