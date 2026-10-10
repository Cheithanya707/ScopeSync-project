"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";

export function DeleteTaskDialog({
  open,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <section role="alertdialog" aria-modal="true" aria-labelledby="delete-task-title" aria-describedby="delete-task-description" className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl" onKeyDown={(event) => {
        if (event.key === "Escape" && !loading) onCancel();
        if (event.key === "Tab" && event.shiftKey && document.activeElement === cancelRef.current) {
          event.preventDefault();
          event.currentTarget.querySelector<HTMLButtonElement>("button:last-of-type")?.focus();
        }
      }}>
        <h2 id="delete-task-title" className="text-lg font-semibold text-slate-950">Delete this task?</h2>
        <p id="delete-task-description" className="mt-2 text-sm leading-6 text-muted-foreground">Deleting this task will permanently remove it from this project.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button ref={cancelRef} autoFocus type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={loading}>{loading ? "Deleting..." : "Delete Task"}</Button>
        </div>
      </section>
    </div>
  );
}
