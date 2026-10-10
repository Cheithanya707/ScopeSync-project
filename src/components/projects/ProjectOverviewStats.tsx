"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CircleDollarSign, FileCheck2, FileStack, ListTodo, Repeat2, TrendingUp } from "lucide-react";
import type { Project } from "@/types";
import { getTasks } from "@/services/tasks/taskStore";
import { getScopeChanges } from "@/services/changes/changeStore";
import { getProjectDocuments } from "@/services/documents/documentStore";
import { getProjectPayments } from "@/services/payments/paymentStore";
import { getRequirements } from "@/services/requirements/requirementStore";
import { formatCurrency } from "@/lib/utils/paymentUtils";

export function ProjectOverviewStats({ project, ownerId }: { project: Project; ownerId: string }) {
  const [taskCount, setTaskCount] = useState<number | null>(null);
  const [requirementCount, setRequirementCount] = useState<number | null>(null);
  const [changeCount, setChangeCount] = useState<number | null>(null);
  const [documentCount, setDocumentCount] = useState<number | null>(null);
  const [paymentPaid, setPaymentPaid] = useState<number | null>(null);
  const [taskError, setTaskError] = useState(false);
  const [requirementError, setRequirementError] = useState(false);
  const [changeError, setChangeError] = useState(false);
  const [documentError, setDocumentError] = useState(false);
  const [paymentError, setPaymentError] = useState(false);

  useEffect(() => {
    let current = true;
    void getTasks(ownerId, project).then((tasks) => {
      if (current) setTaskCount(tasks.length);
    }).catch(() => {
      if (current) setTaskError(true);
    });
    void getRequirements(ownerId, project).then((requirements) => {
      if (current) setRequirementCount(requirements.filter((requirement) => requirement.status !== "archived").length);
    }).catch(() => {
      if (current) setRequirementError(true);
    });
    void getScopeChanges(ownerId, project).then((changes) => {
      if (current) setChangeCount(changes.length);
    }).catch(() => {
      if (current) setChangeError(true);
    });
    void getProjectDocuments(ownerId, project).then((documents) => {
      if (current) setDocumentCount(documents.length);
    }).catch(() => {
      if (current) setDocumentError(true);
    });
    void getProjectPayments(ownerId, project).then((payments) => {
      if (current) setPaymentPaid(payments.filter((payment) => payment.status === "paid" && payment.currency === project.currency)
        .reduce((total, payment) => total + Math.round((payment.amount + Number.EPSILON) * 100), 0) / 100);
    }).catch(() => {
      if (current) setPaymentError(true);
    });
    return () => { current = false; };
  }, [ownerId, project]);

  const metrics = [
    { label: "Requirements", value: requirementError ? "—" : requirementCount === null ? "…" : String(requirementCount), icon: FileCheck2, href: `/projects/${project.id}/requirements` },
    { label: "Tasks", value: taskError ? "—" : taskCount === null ? "…" : String(taskCount), icon: ListTodo, href: `/projects/${project.id}/tasks` },
    { label: "Changes", value: changeError ? "—" : changeCount === null ? "…" : String(changeCount), icon: Repeat2, href: `/projects/${project.id}/changes` },
    { label: "Documents", value: documentError ? "—" : documentCount === null ? "…" : String(documentCount), icon: FileStack, href: `/projects/${project.id}/documents` },
    { label: "Payments", value: paymentError ? "—" : paymentPaid === null ? "…" : `${formatCurrency(paymentPaid, project.currency)} / ${project.budget === undefined ? "No budget" : formatCurrency(project.budget, project.currency)}`, icon: CircleDollarSign, href: `/projects/${project.id}/payments` },
    { label: "Scope growth", value: "Not tracked", icon: TrendingUp },
  ];
  return (
    <section aria-labelledby="project-summary-heading">
      <div className="mb-3">
        <h2 id="project-summary-heading" className="text-lg font-semibold text-slate-950">Project summary</h2>
        <p className="mt-1 text-sm text-muted-foreground">Track requirements, delivery, changes, documents, and payments for this project.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {metrics.map(({ label, value, icon: Icon, href }) => {
          const content = <>
            <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{label}</p><Icon aria-hidden="true" className="size-4 text-slate-400" /></div>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
          </>;
          return href ? <Link key={label} href={href} className="rounded-xl border border-border bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">{content}</Link> : <div key={label} className="rounded-xl border border-border bg-white p-4">{content}</div>;
        })}
      </div>
    </section>
  );
}
