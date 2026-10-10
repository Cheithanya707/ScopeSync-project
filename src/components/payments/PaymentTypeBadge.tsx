import { PAYMENT_TYPES } from "@/lib/constants/payments";
import type { PaymentType } from "@/types";

export function PaymentTypeBadge({ type }: { type: PaymentType }) {
  return <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">{PAYMENT_TYPES.find((item) => item.value === type)?.label ?? "Other"}</span>;
}
