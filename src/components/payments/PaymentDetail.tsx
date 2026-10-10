import { FileText } from "lucide-react";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { PaymentTypeBadge } from "@/components/payments/PaymentTypeBadge";
import { formatPaymentDate, formatPaymentNumber, paymentMethodLabel } from "@/components/payments/paymentHelpers";
import { formatCurrency } from "@/lib/utils/paymentUtils";
import { formatDateTime } from "@/lib/dates";
import type { Payment } from "@/types";

export function PaymentDetail({ payment }: { payment: Payment }) {
  const details = [
    ["Type", <PaymentTypeBadge key="type" type={payment.type} />],
    ["Amount", formatCurrency(payment.amount, payment.currency)],
    ["Status", <PaymentStatusBadge key="status" payment={payment} />],
    ["Payment method", paymentMethodLabel(payment.method)],
    ["Due date", formatPaymentDate(payment.dueDate)],
    ["Paid date", formatPaymentDate(payment.paidDate)],
    ["Reference number", payment.referenceNumber || "—"],
    ["Created", formatDateTime(payment.createdAt)],
    ["Updated", formatDateTime(payment.updatedAt)],
  ] as const;
  return <section className="rounded-xl border border-border bg-white p-5 sm:p-6"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><FileText aria-hidden="true" className="size-5" /></span><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{formatPaymentNumber(payment)}</p><h2 className="mt-1 break-words text-xl font-semibold text-slate-950">{payment.title}</h2></div></div><dl className="mt-5 grid gap-x-6 border-t border-border pt-2 sm:grid-cols-2">{details.map(([label, value]) => <div key={label} className="flex min-w-0 flex-col gap-1 border-b border-border py-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words text-sm font-medium text-slate-800">{value}</dd></div>)}</dl><div className="mt-4"><h3 className="text-sm font-medium text-slate-800">Description</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{payment.description || "No description provided."}</p></div></section>;
}
