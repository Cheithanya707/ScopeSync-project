"use client";

import { Button } from "@/components/ui/button";

export function RemoveMemberDialog({
  open,
  name,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  name: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }} onKeyDown={(event) => { if (event.key === "Escape" && !busy) onCancel(); }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="remove-member-title" aria-describedby="remove-member-description" className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl">
        <h2 id="remove-member-title" className="text-lg font-semibold text-slate-950">Remove {name}?</h2>
        <p id="remove-member-description" className="mt-2 text-sm leading-6 text-muted-foreground">This will remove this person from the workspace and clear their task assignments in this browser.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={busy}>{busy ? "Removing..." : "Remove Person"}</Button>
        </div>
      </section>
    </div>
  );
}
