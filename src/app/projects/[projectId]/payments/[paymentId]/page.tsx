"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeletePaymentDialog } from "@/components/payments/DeletePaymentDialog";
import { MarkPaymentPaidDialog } from "@/components/payments/MarkPaymentPaidDialog";
import { PaymentDetail } from "@/components/payments/PaymentDetail";
import { PaymentSummary } from "@/components/payments/PaymentSummary";
import { formatPaymentNumber } from "@/lib/utils/paymentUtils";
import { useProjectPreview } from "@/hooks/useProjectPreview";
import { deletePayment, getPayment, getProjectPayments, markPaymentPaid } from "@/services/payments/paymentStore";
import type { Payment } from "@/types";

export default function ProjectPaymentDetailPage() {
  const { projectId, paymentId } = useParams<{ projectId: string; paymentId: string }>();
  const router = useRouter();
  const { project, loading: projectLoading, error: projectError, ownerId } = useProjectPreview(projectId);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [markOpen, setMarkOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!project) return;
    let active = true;
    void Promise.all([getPayment(ownerId, project, paymentId), getProjectPayments(ownerId, project)]).then(([item, items]) => {
      if (active) {
        setPayment(item);
        setPayments(items);
      }
    }).catch(() => {
      if (active) setError("Unable to load this payment record. Please try again.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [ownerId, paymentId, project]);

  const markPaid = async () => {
    if (!project) return;
    setBusy(true);
    setError("");
    try {
      await markPaymentPaid(ownerId, project, paymentId);
      const [item, items] = await Promise.all([getPayment(ownerId, project, paymentId), getProjectPayments(ownerId, project)]);
      setPayment(item);
      setPayments(items);
      setMarkOpen(false);
    } catch {
      setError("Unable to mark this payment as paid. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!project) return;
    setBusy(true);
    setError("");
    try {
      await deletePayment(ownerId, project, paymentId);
      router.replace(`/projects/${project.id}/payments`);
    } catch {
      setError("Unable to delete this payment record. Please try again.");
      setBusy(false);
      setDeleteOpen(false);
    }
  };

  if (projectLoading || loading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading payment…</div>;
  if (!project) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold text-slate-950">{projectError ? "Project unavailable" : "Project not found"}</h1><p className="mt-2 text-sm text-muted-foreground">{projectError || "This project is not available in this browser."}</p></section>;
  if (!payment) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold text-slate-950">{error ? "Payment unavailable" : "Payment not found"}</h1><p className="mt-2 text-sm text-muted-foreground">{error || "This payment record may have been removed."}</p><Button asChild variant="outline" className="mt-5"><Link href={`/projects/${project.id}/payments`}>Back to payments</Link></Button></section>;

  return <div><Link href={`/projects/${project.id}/payments`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden="true" className="size-4" />Back to payments</Link><div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-sm text-muted-foreground">{project.name}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Payment details</h1></div><div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href={`/projects/${project.id}/payments/${encodeURIComponent(payment.id)}/edit`}><Pencil aria-hidden="true" />Edit</Link></Button>{payment.status === "pending" && <Button type="button" variant="outline" onClick={() => setMarkOpen(true)}><CheckCircle2 aria-hidden="true" />Mark Paid</Button>}<Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 aria-hidden="true" />Delete</Button></div></div>{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}<div className="mt-6"><PaymentSummary payments={payments} projects={[project]} project={project} /></div><div className="mt-6"><PaymentDetail payment={payment} /></div><MarkPaymentPaidDialog open={markOpen} busy={busy} number={formatPaymentNumber(payment)} onCancel={() => setMarkOpen(false)} onConfirm={() => void markPaid()} /><DeletePaymentDialog open={deleteOpen} busy={busy} number={formatPaymentNumber(payment)} onCancel={() => setDeleteOpen(false)} onConfirm={() => void remove()} /></div>;
}
