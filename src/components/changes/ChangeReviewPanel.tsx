"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ScopeChange } from "@/types";
import { ChangeStatusBadge } from "./ChangeStatusBadge";
import { ChangeConfirmationDialog } from "./ChangeConfirmationDialog";

export type ChangeAction = "start_review" | "approve" | "reject" | "implement" | "cancel";
type ChangeDialogAction = Exclude<ChangeAction, "start_review">;

export function ChangeReviewPanel({
  change,
  busy,
  onAction,
  reviewNotes,
  onReviewNotesChange,
}: {
  change: ScopeChange;
  busy: boolean;
  onAction: (action: ChangeAction, rejectionReason?: string, reviewNotes?: string) => Promise<void>;
  reviewNotes: string;
  onReviewNotesChange: (notes: string) => void;
}) {
  const [dialog, setDialog] = useState<ChangeDialogAction | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const confirm = async () => {
    if (dialog === "reject" && !reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    if (!dialog) return;
    setError("");
    await onAction(dialog, reason, reviewNotes);
    setDialog(null);
    setReason("");
  };
  return <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
    <h2 className="text-lg font-semibold text-slate-950">Change review</h2>
    <div className="mt-4 flex flex-wrap items-center gap-2"><span className="text-sm text-muted-foreground">Current status</span><ChangeStatusBadge status={change.status} /></div>
    {change.status === "rejected" && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4"><h3 className="text-sm font-semibold text-slate-900">Rejection reason</h3><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{change.rejectionReason || "No reason provided."}</p></div>}
    <div className="mt-5"><label htmlFor="change-review-notes" className="mb-1.5 block text-sm font-medium text-slate-800">Review notes <span className="font-normal text-slate-500">(optional)</span></label><textarea id="change-review-notes" maxLength={2000} rows={3} value={reviewNotes} onChange={(event) => onReviewNotesChange(event.target.value)} disabled={change.status !== "under_review" || busy} className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:bg-slate-50" /></div>
    <div className="mt-5 flex flex-wrap gap-2">
      {change.status === "new" && <Button type="button" onClick={() => void onAction("start_review", undefined, reviewNotes)} disabled={busy}>Start Review</Button>}
      {change.status === "under_review" && <><Button type="button" onClick={() => setDialog("approve")} disabled={busy}>Approve Change</Button><Button type="button" variant="outline" onClick={() => setDialog("reject")} disabled={busy}>Reject Change</Button></>}
      {change.status === "approved" && <Button type="button" onClick={() => setDialog("implement")} disabled={busy}>Mark as Implemented</Button>}
      {(change.status === "new" || change.status === "under_review") && <Button type="button" variant="outline" onClick={() => setDialog("cancel")} disabled={busy}>Cancel Change</Button>}
      {change.status === "approved" && <p className="py-2 text-sm text-emerald-800">Approved. This does not automatically change the project requirements or tasks.</p>}
      {change.status === "implemented" && <p className="py-2 text-sm text-blue-800">This change has been marked as implemented.</p>}
      {change.status === "rejected" && <p className="py-2 text-sm text-slate-600">This request was rejected. It cannot be implemented unless a future workflow reopens it.</p>}
      {change.status === "cancelled" && <p className="py-2 text-sm text-slate-600">This change request was cancelled.</p>}
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <ChangeConfirmationDialog open={Boolean(dialog)} mode={dialog ?? "approve"} loading={busy} rejectionReason={reason} setRejectionReason={setReason} onCancel={() => { setDialog(null); setError(""); }} onConfirm={() => void confirm()} />
  </section>;
}
