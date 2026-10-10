"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";

export function ChangeConfirmationDialog({
  open,
  mode,
  loading,
  rejectionReason,
  setRejectionReason,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  mode: "approve" | "reject" | "implement" | "cancel" | "delete";
  loading: boolean;
  rejectionReason: string;
  setRejectionReason: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  if (!open) return null;
  const details = {
    approve: ["Approve this change request?", "Approving this request means the requested change is accepted for the project.", "Approve Change"],
    reject: ["Reject this change request?", "Provide a reason for rejecting this request.", "Reject Change"],
    implement: ["Mark this change as implemented?", "This only records the implementation status and does not create or modify tasks.", "Mark as Implemented"],
    cancel: ["Cancel this change request?", "The change request will remain in the record with Cancelled status.", "Cancel Change"],
    delete: ["Delete this change request?", "Deleting this change request will permanently remove its record.", "Delete Change"],
  }[mode];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="change-confirm-title" aria-describedby="change-confirm-description" className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl" onKeyDown={(event) => {
    if (event.key === "Escape" && !loading) onCancel();
    if (event.key === "Tab" && event.shiftKey && document.activeElement === cancelRef.current) {
      event.preventDefault();
      event.currentTarget.querySelector<HTMLButtonElement>("button:last-of-type")?.focus();
    }
  }}>
    <h2 id="change-confirm-title" className="text-lg font-semibold text-slate-950">{details[0]}</h2><p id="change-confirm-description" className="mt-2 text-sm leading-6 text-muted-foreground">{details[1]}</p>
    {mode === "reject" && <div className="mt-4"><label htmlFor="change-rejection-reason" className="mb-1.5 block text-sm font-medium text-slate-800">Rejection reason <span className="text-red-700">*</span></label><textarea id="change-rejection-reason" rows={4} maxLength={2000} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand" /><p className="mt-1 text-right text-xs text-muted-foreground">{rejectionReason.length}/2000</p></div>}
    <div className="mt-6 flex justify-end gap-3"><Button ref={cancelRef} autoFocus type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button><Button type="button" variant={mode === "delete" || mode === "reject" ? "destructive" : "default"} onClick={onConfirm} disabled={loading || (mode === "reject" && !rejectionReason.trim())}>{loading ? "Please wait..." : details[2]}</Button></div>
  </section></div>;
}
