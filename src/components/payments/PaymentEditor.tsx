"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentForm, defaultPaymentDraft, type PaymentFormDraft } from "@/components/payments/PaymentForm";
import { useProjectPreview } from "@/hooks/useProjectPreview";
import { createPayment, getPayment, updatePayment } from "@/services/payments/paymentStore";
import type { PaymentFormValues } from "@/types";

export function PaymentEditor({ projectId, paymentId }: { projectId: string; paymentId?: string }) {
  const { project, loading, error: projectError, ownerId } = useProjectPreview(projectId);
  const router = useRouter();
  const [values, setValues] = useState<PaymentFormDraft>(defaultPaymentDraft("INR"));
  const [currencyTouched, setCurrencyTouched] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(Boolean(paymentId));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!project || !paymentId) return;
    let active = true;
    void getPayment(ownerId, project, paymentId).then((payment) => {
      if (!active) return;
      if (!payment) {
        setError("Payment not found in this project.");
        return;
      }
      setValues({
        title: payment.title,
        description: payment.description ?? "",
        type: payment.type,
        status: payment.status,
        method: payment.method,
        amount: String(payment.amount),
        currency: payment.currency,
        dueDate: payment.dueDate ?? "",
        paidDate: payment.paidDate ?? "",
        referenceNumber: payment.referenceNumber ?? "",
      });
    }).catch(() => {
      if (active) setError("Unable to load this payment record. Please try again.");
    }).finally(() => {
      if (active) setLoadingPayment(false);
    });
    return () => { active = false; };
  }, [ownerId, paymentId, project]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (values.title.trim().length < 3 || values.title.trim().length > 150) {
      setError("Payment title must be between 3 and 150 characters.");
      return;
    }
    const amount = Number(values.amount);
    if (!values.amount.trim() || !Number.isFinite(amount) || amount <= 0 || amount > 999_999_999_999.99) {
      setError("Enter a positive payment amount within the supported limit.");
      return;
    }
    if (!project) return;
    const formValues = !paymentId && !currencyTouched ? { ...values, currency: project.currency } : values;
    const payload: PaymentFormValues = {
      title: formValues.title,
      description: formValues.description,
      type: formValues.type,
      status: formValues.status,
      method: formValues.method || undefined,
      amount: Math.round((amount + Number.EPSILON) * 100) / 100,
      currency: formValues.currency,
      dueDate: formValues.dueDate,
      paidDate: formValues.paidDate,
      referenceNumber: formValues.referenceNumber,
    };
    setSaving(true);
    try {
      const payment = paymentId
        ? await updatePayment(ownerId, project, paymentId, payload)
        : await createPayment(ownerId, project, payload);
      router.push(`/projects/${project.id}/payments/${encodeURIComponent(payment.id)}`);
    } catch (submitError) {
      setError(submitError instanceof Error && submitError.message.includes("date")
        ? submitError.message
        : paymentId ? "Unable to update this payment. Please try again." : "Unable to create this payment. Please try again.");
      setSaving(false);
    }
  };

  if (loading || loadingPayment) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading payment…</div>;
  if (!project) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold text-slate-950">{projectError ? "Project unavailable" : "Project not found"}</h1><p className="mt-2 text-sm text-muted-foreground">{projectError || "This project is not available in this browser."}</p><Button asChild variant="outline" className="mt-5"><Link href="/projects">Back to projects</Link></Button></section>;
  if (paymentId && error === "Payment not found in this project.") return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold text-slate-950">Payment not found</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button asChild variant="outline" className="mt-5"><Link href={`/projects/${project.id}/payments`}>Back to payments</Link></Button></section>;

  return <div className="mx-auto max-w-3xl"><Link href={`/projects/${project.id}/payments`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden={true} className="size-4" />Back to payments</Link><h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">{paymentId ? "Edit payment" : "Add payment"}</h1><p className="mt-2 text-sm text-muted-foreground">Record a payment for {project.name}. ScopeSync will not process a transfer.</p>  <form onSubmit={(event) => void submit(event)} className="mt-7 rounded-xl border border-border bg-white p-5 sm:p-7"><PaymentForm value={!paymentId && !currencyTouched ? { ...values, currency: project.currency } : values} onChange={(next) => { if (next.currency !== values.currency) setCurrencyTouched(true); setValues(next); }} busy={saving} />{error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}<div className="mt-7 flex flex-col-reverse justify-end gap-3 border-t border-border pt-5 sm:flex-row"><Button asChild type="button" variant="outline"><Link href={`/projects/${project.id}/payments`}>Cancel</Link></Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : paymentId ? "Save Changes" : "Create Payment"}</Button></div></form></div>;
}
