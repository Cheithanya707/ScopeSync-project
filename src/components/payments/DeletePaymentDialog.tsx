"use client";

import { Button } from "@/components/ui/button";

export function DeletePaymentDialog({ open, busy, number, onCancel, onConfirm }: { open: boolean; busy: boolean; number: string; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }} onKeyDown={(event) => { if (event.key === "Escape" && !busy) onCancel(); }}><section role="alertdialog" aria-modal="true" aria-labelledby="delete-payment-title" aria-describedby="delete-payment-description" className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl"><h2 id="delete-payment-title" className="text-lg font-semibold text-slate-950">Delete this payment record?</h2><p id="delete-payment-description" className="mt-2 text-sm leading-6 text-muted-foreground">Deleting this record will remove it from the project&apos;s financial history.</p><p className="mt-3 text-sm font-medium text-slate-900">{number}</p><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button><Button type="button" variant="destructive" onClick={onConfirm} disabled={busy}>{busy ? "Deleting..." : "Delete Payment"}</Button></div></section></div>;
}
