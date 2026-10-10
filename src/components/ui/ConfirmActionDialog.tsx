"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

type ConfirmActionDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  loading: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  loading,
  error,
  onCancel,
  onConfirm,
}: ConfirmActionDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        aria-describedby="confirm-action-description"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !loading) {
            event.preventDefault();
            onCancel();
          }
          if (event.key === "Tab") {
            const first = cancelRef.current;
            const last = confirmRef.current;
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <h2 id="confirm-action-title" className="text-lg font-semibold">{title}</h2>
        <p id="confirm-action-description" className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button ref={confirmRef} type="button" variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Please wait…" : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
