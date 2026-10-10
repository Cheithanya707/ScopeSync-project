import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { formatPaymentDate, formatPaymentNumber } from "@/components/payments/paymentHelpers";
import { daysOverdue, formatCurrency, isPaymentOverdue } from "@/lib/utils/paymentUtils";
import type { Payment } from "@/types";

export function OverduePayments({ payments, getHref }: { payments: Payment[]; getHref: (payment: Payment) => string }) {
  const overdue = payments.filter((payment) => isPaymentOverdue(payment));
  if (!overdue.length) return null;
  return <section aria-labelledby="overdue-payments-heading" className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5"><div className="flex items-center gap-2"><AlertCircle aria-hidden="true" className="size-5 text-amber-800" /><h2 id="overdue-payments-heading" className="font-semibold text-slate-950">Overdue payments</h2></div><ul className="mt-3 divide-y divide-amber-200">{overdue.map((payment) => <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><span className="min-w-0"><Link href={getHref(payment)} className="font-medium text-brand hover:underline">{formatPaymentNumber(payment)} — {payment.title}</Link><span className="mt-1 block text-xs text-slate-600">Due {formatPaymentDate(payment.dueDate)} · {daysOverdue(payment)} days overdue</span></span><span className="flex items-center gap-2"><span className="text-sm font-semibold text-slate-900">{formatCurrency(payment.amount, payment.currency)}</span><PaymentStatusBadge payment={payment} /></span></li>)}</ul></section>;
}
