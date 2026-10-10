"use client";

import Link from "next/link";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentCard } from "@/components/payments/PaymentCard";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { PaymentTypeBadge } from "@/components/payments/PaymentTypeBadge";
import { formatCurrency } from "@/lib/utils/paymentUtils";
import { formatPaymentDate, formatPaymentNumber, paymentMethodLabel } from "@/components/payments/paymentHelpers";
import type { Payment } from "@/types";

export function PaymentList({ payments, projectNames, getHref, onMarkPaid, onDelete, emptyTitle = "No payment records yet", emptyDescription = "Add payment records to track the financial progress of this project.", emptyAction }: {
  payments: Payment[];
  projectNames?: Map<string, string>;
  getHref: (payment: Payment) => string;
  onMarkPaid?: (payment: Payment) => void;
  onDelete?: (payment: Payment) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}) {
  if (!payments.length) return <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><h2 className="text-lg font-semibold text-slate-950">{emptyTitle}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{emptyDescription}</p>{emptyAction && <div className="mt-5">{emptyAction}</div>}</section>;
  return <>
    <div className="grid gap-3 md:hidden">{payments.map((payment) => <PaymentCard key={payment.id} payment={payment} projectName={projectNames?.get(payment.projectId)} href={getHref(payment)} onMarkPaid={onMarkPaid} onDelete={onDelete} />)}</div>
    <div className="hidden overflow-hidden rounded-xl border border-border bg-white md:block"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500"><tr>{["Payment", ...(projectNames ? ["Project"] : []), "Type", "Amount", "Status", "Due Date", "Paid Date", "Method", "Reference", "Actions"].map((header) => <th key={header} scope="col" className="px-4 py-3">{header}</th>)}</tr></thead><tbody className="divide-y divide-border">{payments.map((payment) => <tr key={payment.id} className="hover:bg-slate-50/70"><td className="max-w-[250px] px-4 py-3"><Link href={getHref(payment)} className="font-semibold text-brand hover:underline">{formatPaymentNumber(payment)}</Link><p className="mt-1 truncate font-medium text-slate-900">{payment.title}</p></td>{projectNames && <td className="max-w-[180px] truncate px-4 py-3"><Link className="text-brand hover:underline" href={`/projects/${payment.projectId}/payments`}>{projectNames.get(payment.projectId) ?? "Project"}</Link></td>}<td className="px-4 py-3"><PaymentTypeBadge type={payment.type} /></td><td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{formatCurrency(payment.amount, payment.currency)}</td><td className="px-4 py-3"><PaymentStatusBadge payment={payment} /></td><td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatPaymentDate(payment.dueDate)}</td><td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatPaymentDate(payment.paidDate)}</td><td className="px-4 py-3 text-slate-700">{paymentMethodLabel(payment.method)}</td><td className="max-w-[150px] truncate px-4 py-3 text-slate-700">{payment.referenceNumber || "—"}</td><td className="px-4 py-3"><div className="flex items-center gap-1"><Button asChild variant="ghost" size="icon-sm"><Link href={`${getHref(payment)}/edit`} aria-label={`Edit ${formatPaymentNumber(payment)}`}><Pencil aria-hidden="true" /></Link></Button>{payment.status === "pending" && onMarkPaid && <Button type="button" variant="ghost" size="icon-sm" aria-label={`Mark ${formatPaymentNumber(payment)} as paid`} onClick={() => onMarkPaid(payment)}><CheckCircle2 aria-hidden="true" /></Button>}{onDelete && <Button type="button" variant="ghost" size="icon-sm" aria-label={`Delete ${formatPaymentNumber(payment)}`} onClick={() => onDelete(payment)}><Trash2 aria-hidden="true" /></Button>}</div></td></tr>)}</tbody></table></div></div>
  </>;
}
