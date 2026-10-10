"use client";

import { PAYMENT_CURRENCIES, PAYMENT_METHODS, PAYMENT_STATUSES, PAYMENT_TYPES } from "@/lib/constants/payments";
import { Input } from "@/components/ui/input";
import type { PaymentFormValues, Project } from "@/types";

export type PaymentFormDraft = Omit<PaymentFormValues, "amount"> & { amount: string };
export const defaultPaymentDraft = (currency: Project["currency"]): PaymentFormDraft => ({
  title: "",
  description: "",
  type: "milestone",
  status: "pending",
  method: undefined,
  amount: "",
  currency,
  dueDate: "",
  paidDate: "",
  referenceNumber: "",
});

export function PaymentForm({ value, onChange, errors = {}, busy = false }: {
  value: PaymentFormDraft;
  onChange: (value: PaymentFormDraft) => void;
  errors?: Record<string, string>;
  busy?: boolean;
}) {
  const field = (key: keyof PaymentFormDraft, next: string) => onChange({ ...value, [key]: next });
  const selectStyle = "h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60";
  return <div className="grid gap-5 sm:grid-cols-2">
    <div className="sm:col-span-2"><label htmlFor="payment-title" className="mb-1.5 block text-sm font-medium text-slate-800">Title <span className="text-red-700">*</span></label><Input id="payment-title" value={value.title} onChange={(event) => field("title", event.target.value)} minLength={3} maxLength={150} required disabled={busy} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "payment-title-error" : undefined} placeholder="Website milestone payment" />{errors.title && <p id="payment-title-error" role="alert" className="mt-1 text-xs text-red-700">{errors.title}</p>}</div>
    <div><label htmlFor="payment-type" className="mb-1.5 block text-sm font-medium text-slate-800">Payment type <span className="text-red-700">*</span></label><select className={selectStyle} id="payment-type" value={value.type} onChange={(event) => field("type", event.target.value)} disabled={busy}>{PAYMENT_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
    <div><label htmlFor="payment-status" className="mb-1.5 block text-sm font-medium text-slate-800">Status <span className="text-red-700">*</span></label><select className={selectStyle} id="payment-status" value={value.status} onChange={(event) => field("status", event.target.value)} disabled={busy}>{PAYMENT_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
    <div><label htmlFor="payment-amount" className="mb-1.5 block text-sm font-medium text-slate-800">Amount <span className="text-red-700">*</span></label><Input id="payment-amount" type="number" inputMode="decimal" min="0.01" max="999999999999.99" step="0.01" value={value.amount} onChange={(event) => field("amount", event.target.value)} required disabled={busy} aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? "payment-amount-error" : undefined} placeholder="0.00" />{errors.amount && <p id="payment-amount-error" role="alert" className="mt-1 text-xs text-red-700">{errors.amount}</p>}</div>
    <div><label htmlFor="payment-currency" className="mb-1.5 block text-sm font-medium text-slate-800">Currency <span className="text-red-700">*</span></label><select className={selectStyle} id="payment-currency" value={value.currency} onChange={(event) => field("currency", event.target.value)} disabled={busy}>{PAYMENT_CURRENCIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
    <div><label htmlFor="payment-method" className="mb-1.5 block text-sm font-medium text-slate-800">Payment method <span className="font-normal text-muted-foreground">(optional)</span></label><select className={selectStyle} id="payment-method" value={value.method ?? ""} onChange={(event) => field("method", event.target.value)} disabled={busy}><option value="">Choose a method</option>{PAYMENT_METHODS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><p className="mt-1 text-xs text-muted-foreground">Record only; ScopeSync does not process payments.</p></div>
    <div><label htmlFor="payment-due-date" className="mb-1.5 block text-sm font-medium text-slate-800">Due date</label><Input id="payment-due-date" type="date" value={value.dueDate ?? ""} onChange={(event) => field("dueDate", event.target.value)} disabled={busy} aria-invalid={Boolean(errors.dueDate)} />{errors.dueDate && <p role="alert" className="mt-1 text-xs text-red-700">{errors.dueDate}</p>}</div>
    <div><label htmlFor="payment-paid-date" className="mb-1.5 block text-sm font-medium text-slate-800">Paid date</label><Input id="payment-paid-date" type="date" value={value.paidDate ?? ""} onChange={(event) => field("paidDate", event.target.value)} disabled={busy} aria-invalid={Boolean(errors.paidDate)} />{errors.paidDate && <p role="alert" className="mt-1 text-xs text-red-700">{errors.paidDate}</p>}</div>
    <div><label htmlFor="payment-reference" className="mb-1.5 block text-sm font-medium text-slate-800">Reference number</label><Input id="payment-reference" maxLength={120} value={value.referenceNumber ?? ""} onChange={(event) => field("referenceNumber", event.target.value)} disabled={busy} placeholder="Optional payment reference" /></div>
    <div className="sm:col-span-2"><label htmlFor="payment-description" className="mb-1.5 block text-sm font-medium text-slate-800">Description <span className="font-normal text-muted-foreground">(optional)</span></label><textarea id="payment-description" rows={4} maxLength={1000} value={value.description ?? ""} onChange={(event) => field("description", event.target.value)} disabled={busy} className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand" /></div>
  </div>;
}
