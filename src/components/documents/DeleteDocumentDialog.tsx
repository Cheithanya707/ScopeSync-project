"use client";

import { Button } from "@/components/ui/button";

export function DeleteDocumentDialog({ open, busy, name, onCancel, onConfirm }: { open: boolean; busy: boolean; name: string; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }} onKeyDown={(event) => { if (event.key === "Escape" && !busy) onCancel(); }}>
    <section role="alertdialog" aria-modal="true" aria-labelledby="delete-document-title" aria-describedby="delete-document-description" className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl">
      <h2 id="delete-document-title" className="text-lg font-semibold text-slate-950">Delete this document?</h2><p id="delete-document-description" className="mt-2 text-sm leading-6 text-muted-foreground">Deleting this document will remove the file from this project.</p><p className="mt-3 break-words text-sm font-medium text-slate-900">{name}</p>
      <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button><Button type="button" variant="destructive" onClick={onConfirm} disabled={busy}>{busy ? "Deleting..." : "Delete Document"}</Button></div>
    </section>
  </div>;
}
