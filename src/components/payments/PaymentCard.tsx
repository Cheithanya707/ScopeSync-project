"use client";

import Link from "next/link";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { formatCurrency } from "@/lib/utils/paymentUtils";
import { formatPaymentDate, formatPaymentNumber, paymentMethodLabel, paymentTypeLabel } from "@/components/payments/paymentHelpers";
import type { Payment } from "@/types";

export function PaymentCard({ payment, projectName, href, onMarkPaid, onDelete }: {
  payment: Payment;
  projectName?: string;
  href: string;
  onMarkPaid?: (payment: Payment) => void;
  onDelete?: (payment: Payment) => void;
}) {
  const statusActions = payment.status === "pending" && onMarkPaid;
  return <article className="rounded-xl border border-border bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={href} className="font-semibold text-brand hover:underline">{formatPaymentNumber(payment)}</Link><h2 className="mt-1 break-words font-medium text-slate-950">{payment.title}</h2>{projectName && <p className="mt-1 truncate text-xs text-muted-foreground">{projectName}</p>}</div><PaymentStatusBadge payment={payment} /></div>
    <p className="mt-3 text-xl font-semibold text-slate-950">{formatCurrency(payment.amount, payment.currency)}</p>
    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border pt-3 text-xs"><div><dt className="text-muted-foreground">Type</dt><dd className="mt-0.5 font-medium text-slate-800">{paymentTypeLabel(payment.type)}</dd></div><div><dt className="text-muted-foreground">Method</dt><dd className="mt-0.5 font-medium text-slate-800">{paymentMethodLabel(payment.method)}</dd></div><div><dt className="text-muted-foreground">Due date</dt><dd className="mt-0.5 font-medium text-slate-800">{formatPaymentDate(payment.dueDate)}</dd></div><div><dt className="text-muted-foreground">Paid date</dt><dd className="mt-0.5 font-medium text-slate-800">{formatPaymentDate(payment.paidDate)}</dd></div></dl>
    <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3"><Button asChild size="sm" variant="outline"><Link href={href}>View</Link></Button><Button asChild size="sm" variant="ghost"><Link href={`${href}/edit`} aria-label={`Edit ${formatPaymentNumber(payment)}`}><Pencil aria-hidden="true" />Edit</Link></Button>{statusActions && <Button type="button" size="sm" variant="outline" onClick={() => onMarkPaid(payment)}><CheckCircle2 aria-hidden="true" />Mark Paid</Button>}{onDelete && <Button type="button" size="sm" variant="ghost" onClick={() => onDelete(payment)} aria-label={`Delete ${formatPaymentNumber(payment)}`}><Trash2 aria-hidden="true" />Delete</Button>}</div>
  </article>;
}
