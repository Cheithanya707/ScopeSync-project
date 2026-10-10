"use client";

import { Button } from "@/components/ui/button";

export function MarkPaymentPaidDialog({ open, busy, number, onCancel, onConfirm }: { open: boolean; busy: boolean; number: string; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }} onKeyDown={(event) => { if (event.key === "Escape" && !busy) onCancel(); }}><section role="alertdialog" aria-modal="true" aria-labelledby="mark-paid-title" aria-describedby="mark-paid-description" className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl"><h2 id="mark-paid-title" className="text-lg font-semibold text-slate-950">Mark this payment as paid?</h2><p id="mark-paid-description" className="mt-2 text-sm leading-6 text-muted-foreground">This records the payment as paid today. ScopeSync will not process a money transfer.</p><p className="mt-3 text-sm font-medium text-slate-900">{number}</p><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button><Button type="button" onClick={onConfirm} disabled={busy}>{busy ? "Updating..." : "Mark as Paid"}</Button></div></section></div>;
}
