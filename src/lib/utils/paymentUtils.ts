import { localDateKey, parseDateOnly } from "@/lib/dates";
import type { Payment, PaymentStatus, Project } from "@/types";

export interface CurrencyTotal {
  currency: Project["currency"];
  amount: number;
}

function sumMinorUnits(payments: Payment[]): Map<Project["currency"], number> {
  const totals = new Map<Project["currency"], number>();
  for (const payment of payments) {
    const units = Math.round((payment.amount + Number.EPSILON) * 100);
    totals.set(payment.currency, (totals.get(payment.currency) ?? 0) + units);
  }
  return totals;
}

export function totalsByCurrency(payments: Payment[]): CurrencyTotal[] {
  return [...sumMinorUnits(payments)].map(([currency, minorUnits]) => ({ currency, amount: minorUnits / 100 }));
}

export function calculateTotalPaid(payments: Payment[]): CurrencyTotal[] {
  return totalsByCurrency(payments.filter((payment) => payment.status === "paid"));
}

export function calculateTotalPending(payments: Payment[]): CurrencyTotal[] {
  return totalsByCurrency(payments.filter((payment) => payment.status === "pending"));
}

export function calculateRefunded(payments: Payment[]): CurrencyTotal[] {
  return totalsByCurrency(payments.filter((payment) => payment.status === "refunded"));
}

export function calculateOutstanding(budget: number | undefined, currency: Project["currency"], payments: Payment[]): number {
  const paidMinorUnits = sumMinorUnits(payments.filter((payment) => payment.status === "paid"))
    .get(currency) ?? 0;
  const budgetMinorUnits = Number.isFinite(budget) ? Math.round(((budget ?? 0) + Number.EPSILON) * 100) : 0;
  return Math.max(0, budgetMinorUnits - paidMinorUnits) / 100;
}

export function isPaymentOverdue(payment: Payment, today = localDateKey()): boolean {
  return payment.status === "pending" && Boolean(payment.dueDate && parseDateOnly(payment.dueDate) && payment.dueDate < today);
}

export function getPaymentDisplayStatus(payment: Payment): PaymentStatus {
  return isPaymentOverdue(payment) ? "overdue" : payment.status;
}

export function daysOverdue(payment: Payment, today = localDateKey()): number {
  if (!isPaymentOverdue(payment, today) || !payment.dueDate) return 0;
  const due = parseDateOnly(payment.dueDate);
  const current = parseDateOnly(today);
  return due && current ? Math.floor((current.getTime() - due.getTime()) / 86_400_000) : 0;
}

export function formatCurrency(amount: number, currency: Project["currency"]): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

export function formatPaymentNumber(payment: Pick<Payment, "paymentNumber">): string {
  return `PAY-${String(payment.paymentNumber).padStart(3, "0")}`;
}

export function currencyTotalsLabel(totals: CurrencyTotal[]): string {
  return totals.length ? totals.map(({ amount, currency }) => formatCurrency(amount, currency)).join(" · ") : "—";
}
