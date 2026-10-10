"use client";

import { Banknote, CircleDollarSign, Clock3, Wallet } from "lucide-react";
import { calculateOutstanding, calculateTotalPaid, calculateTotalPending, currencyTotalsLabel, totalsByCurrency } from "@/lib/utils/paymentUtils";
import type { Payment, Project } from "@/types";

export function PaymentSummary({ payments, projects, project }: { payments: Payment[]; projects: Project[]; project?: Project }) {
  const selectedProjects = project ? [project] : projects;
  const budgetGroups = new Map<Project["currency"], number>();
  for (const item of selectedProjects) {
    if (Number.isFinite(item.budget) && item.budget !== undefined) {
      const cents = Math.round((item.budget + Number.EPSILON) * 100);
      budgetGroups.set(item.currency, (budgetGroups.get(item.currency) ?? 0) + cents);
    }
  }
  const budgets = [...budgetGroups].map(([currency, cents]) => ({ currency, amount: cents / 100 }));
  const paid = calculateTotalPaid(payments);
  const pending = calculateTotalPending(payments);
  const outstanding = project
    ? [{ currency: project.currency, amount: calculateOutstanding(project.budget, project.currency, payments) }]
    : selectedProjects.reduce((totals, item) => {
        const amount = calculateOutstanding(item.budget, item.currency, payments.filter((payment) => payment.projectId === item.id));
        const entry = totals.find((total) => total.currency === item.currency);
        if (entry) entry.amount += amount;
        else totals.push({ currency: item.currency, amount });
        return totals;
      }, [] as ReturnType<typeof totalsByCurrency>);
  const metrics = [
    { label: project ? "Project Budget" : "Total Project Budget", value: currencyTotalsLabel(budgets), icon: CircleDollarSign },
    { label: "Total Paid", value: currencyTotalsLabel(paid), icon: Banknote },
    { label: "Pending", value: currencyTotalsLabel(pending), icon: Clock3 },
    { label: "Outstanding", value: currencyTotalsLabel(outstanding), icon: Wallet },
  ];
  const overBudget = selectedProjects.some((item) =>
    (calculateTotalPaid(payments.filter((payment) => payment.projectId === item.id)).find((total) => total.currency === item.currency)?.amount ?? 0) > (item.budget ?? 0),
  );
  const refunded = currencyTotalsLabel(totalsByCurrency(payments.filter((payment) => payment.status === "refunded")));

  return <section aria-label="Financial summary"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-xl border border-border bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-2"><p className="text-sm text-muted-foreground">{label}</p><Icon aria-hidden="true" className="size-4 text-slate-400" /></div><p className="mt-3 break-words text-xl font-semibold text-slate-950">{value}</p></article>)}</div>{overBudget && <p role="status" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Paid amount exceeds project budget.</p>}{refunded !== "—" && <p className="mt-3 text-xs text-muted-foreground">Refunded (excluded from paid total): {refunded}</p>}</section>;
}
