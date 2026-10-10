"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeletePaymentDialog } from "@/components/payments/DeletePaymentDialog";
import { MarkPaymentPaidDialog } from "@/components/payments/MarkPaymentPaidDialog";
import { OverduePayments } from "@/components/payments/OverduePayments";
import { PaymentFilters } from "@/components/payments/PaymentFilters";
import { PaymentList } from "@/components/payments/PaymentList";
import { PaymentSearch } from "@/components/payments/PaymentSearch";
import { PaymentSummary } from "@/components/payments/PaymentSummary";
import { formatPaymentNumber } from "@/lib/utils/paymentUtils";
import type { PaymentSort } from "@/lib/constants/payments";
import { getPaymentDisplayStatus } from "@/lib/utils/paymentUtils";
import { deletePayment, getProjectPayments, getWorkspacePayments, markPaymentPaid } from "@/services/payments/paymentStore";
import { useWorkspace } from "@/context/WorkspaceContext";
import { getProjects } from "@/services/projects/projectStore";
import type { Payment, PaymentMethod, PaymentStatus, PaymentType, Project } from "@/types";

export function PaymentManager({ ownerId, project }: { ownerId: string; project?: Project }) {
  const workspaceState = useWorkspace();
  const workspace = !project;
  const activeWorkspaceId = workspaceState.workspaceId ?? ownerId;
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(project ? [project] : []);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [type, setType] = useState<PaymentType | "all">("all");
  const [method, setMethod] = useState<PaymentMethod | "all">("all");
  const [sort, setSort] = useState<PaymentSort>("newest");
  const [marking, setMarking] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState<Payment | null>(null);
  const [busy, setBusy] = useState(false);
  const [chooseProject, setChooseProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const projectList = workspace ? await getProjects(ownerId, activeWorkspaceId) : project ? [project] : [];
      const items = workspace
        ? await getWorkspacePayments(ownerId, activeWorkspaceId, projectList)
        : project ? await getProjectPayments(ownerId, project) : [];
      setProjects(projectList);
      setPayments(items);
    } catch {
      setError("Unable to load payment records from this browser. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId, ownerId, project, workspace]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const projectNames = useMemo(() => new Map(projects.map((item) => [item.id, item.name])), [projects]);
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return payments.filter((payment) => {
      const matchSearch = !search || `${formatPaymentNumber(payment)} ${payment.title} ${payment.description ?? ""} ${payment.referenceNumber ?? ""}`.toLocaleLowerCase().includes(search);
      const matchStatus = status === "all" || getPaymentDisplayStatus(payment) === status;
      return matchSearch && matchStatus && (type === "all" || payment.type === type) && (method === "all" || payment.method === method);
    }).sort((a, b) => {
      switch (sort) {
        case "oldest": return a.createdAt.localeCompare(b.createdAt);
        case "amount_high": return b.amount - a.amount;
        case "amount_low": return a.amount - b.amount;
        case "due_date": return (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31");
        case "name": return a.title.localeCompare(b.title);
        default: return b.createdAt.localeCompare(a.createdAt);
      }
    });
  }, [method, payments, query, sort, status, type]);

  const confirmMarkPaid = async () => {
    if (!marking) return;
    const parent = projects.find((item) => item.id === marking.projectId);
    if (!parent) {
      setError("The project for this payment could not be found.");
      setMarking(null);
      return;
    }
    setBusy(true);
    try {
      await markPaymentPaid(ownerId, parent, marking.id);
      setMarking(null);
      await load();
    } catch {
      setError("Unable to mark this payment as paid. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const parent = projects.find((item) => item.id === deleting.projectId);
    if (!parent) {
      setError("The project for this payment could not be found.");
      setDeleting(null);
      return;
    }
    setBusy(true);
    try {
      await deletePayment(ownerId, parent, deleting.id);
      setDeleting(null);
      await load();
    } catch {
      setError("Unable to delete this payment record. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const hrefFor = (payment: Payment) => `/projects/${payment.projectId}/payments/${encodeURIComponent(payment.id)}`;
  const workspaceNoProjects = workspace && !loading && projects.length === 0;

  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-brand">{workspace ? "Workspace" : project?.name}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Payments</h1><p className="mt-2 text-sm text-muted-foreground">Track project budgets, payments and outstanding amounts.</p></div>{workspace ? <Button type="button" onClick={() => { setSelectedProjectId(projects[0]?.id ?? ""); setChooseProject(true); }} disabled={!projects.length}><Plus aria-hidden="true" />Add Payment</Button> : <Button asChild><Link href={`/projects/${project?.id}/payments/new`}><Plus aria-hidden="true" />Add Payment</Link></Button>}</div>
    <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">Local browser preview: these manual payment records are stored only in this browser. No money transfers are processed.</p>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {!loading && <div className="mt-6"><PaymentSummary payments={payments} projects={projects} project={project} /></div>}
    {!loading && <div className="mt-6"><OverduePayments payments={payments} getHref={hrefFor} /></div>}
    {!loading && payments.length > 0 && <section aria-label="Search and filter payments" className="mt-6 grid gap-3 rounded-xl border border-border bg-white p-4 xl:grid-cols-[minmax(240px,1fr)_2fr]"><PaymentSearch value={query} onChange={setQuery} /><PaymentFilters status={status} type={type} method={method} sort={sort} onStatus={setStatus} onType={setType} onMethod={setMethod} onSort={setSort} /></section>}
    <div className="mt-6">{loading ? <div role="status" className="rounded-xl border border-border bg-white p-12 text-center text-sm text-muted-foreground">Loading payment records…</div> : workspaceNoProjects ? <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><h2 className="text-lg font-semibold text-slate-950">No projects yet</h2><p className="mt-2 text-sm text-muted-foreground">Create a project before adding a payment record.</p><Button asChild className="mt-5"><Link href="/projects/new">Create Project</Link></Button></section> : <PaymentList payments={filtered} projectNames={workspace ? projectNames : undefined} getHref={hrefFor} onMarkPaid={(payment) => setMarking(payment)} onDelete={(payment) => setDeleting(payment)} emptyAction={!payments.length && project ? <Button asChild><Link href={`/projects/${project.id}/payments/new`}><Plus aria-hidden="true" />Add Payment</Link></Button> : undefined} emptyDescription={!payments.length ? "Add payment records to track the financial progress of this project." : "No payment records match your search or filters."} emptyTitle={!payments.length ? "No payment records yet" : "No matching payments"} />}</div>
    <MarkPaymentPaidDialog open={Boolean(marking)} busy={busy} number={marking ? formatPaymentNumber(marking) : ""} onCancel={() => setMarking(null)} onConfirm={() => void confirmMarkPaid()} />
    <DeletePaymentDialog open={Boolean(deleting)} busy={busy} number={deleting ? formatPaymentNumber(deleting) : ""} onCancel={() => setDeleting(null)} onConfirm={() => void confirmDelete()} />
    {chooseProject && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setChooseProject(false); }} onKeyDown={(event) => { if (event.key === "Escape") setChooseProject(false); }}><section role="dialog" aria-modal="true" aria-labelledby="payment-project-title" className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl"><h2 id="payment-project-title" className="text-lg font-semibold text-slate-950">Choose a project</h2><p className="mt-2 text-sm text-muted-foreground">Select where this payment record belongs.</p><label htmlFor="payment-project-select" className="mb-1.5 mt-5 block text-sm font-medium text-slate-800">Project</label><select id="payment-project-select" value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><option value="">Choose a project</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setChooseProject(false)}>Cancel</Button><Button type="button" disabled={!selectedProjectId} onClick={() => router.push(`/projects/${selectedProjectId}/payments/new`)}>Continue</Button></div></section></div>}
  </div>;
}
