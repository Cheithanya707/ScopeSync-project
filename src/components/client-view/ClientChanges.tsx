"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { ClientChangeRequestForm } from "@/components/client-view/ClientChangeRequestForm";
import { ClientCard, ClientEmpty, clientDateLabel, clientHumanize } from "@/components/client-view/ClientViewPrimitives";
import type { ClientChange } from "@/services/client-view/clientShareData";
import type { TaskPriority } from "@/types";

const DECIDABLE = new Set(["new", "under_review"]);

function ChangeDecision({ change, onDecide }: {
  change: ClientChange;
  onDecide: (changeId: string, decision: "approved" | "rejected", comment: string) => Promise<void>;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (decision: "approved" | "rejected") => {
    if (decision === "rejected" && !comment.trim()) {
      setError("Add a short reason so the team knows what to adjust.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onDecide(change.id, decision, comment.trim());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your decision could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="mt-4 border-t border-border pt-4">
    {rejecting && <>
      <label htmlFor={`reject-${change.id}`} className="mb-1.5 block text-sm font-medium text-slate-800">Reason for rejecting</label>
      <textarea id={`reject-${change.id}`} rows={3} maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" />
    </>}
    {error && <p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}
    <div className="mt-3 flex flex-wrap gap-2">
      {!rejecting && <button type="button" disabled={busy} onClick={() => void submit("approved")} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{busy ? "Saving…" : "Approve change"}</button>}
      {rejecting
        ? <>
            <button type="button" disabled={busy} onClick={() => void submit("rejected")} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{busy ? "Saving…" : "Confirm rejection"}</button>
            <button type="button" disabled={busy} onClick={() => { setRejecting(false); setError(""); }} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
          </>
        : <button type="button" disabled={busy} onClick={() => setRejecting(true)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-slate-700">Reject…</button>}
    </div>
  </div>;
}

export function ClientChanges({
  changes,
  canViewChanges,
  canSubmitRequest,
  canApprove = false,
  onSubmitRequest,
  onDecide,
}: {
  changes: ClientChange[];
  canViewChanges: boolean;
  canSubmitRequest: boolean;
  canApprove?: boolean;
  onSubmitRequest: (data: { title: string; description: string; priority: TaskPriority }) => Promise<void>;
  onDecide?: (changeId: string, decision: "approved" | "rejected", comment: string) => Promise<void>;
}) {
  return <div className="mt-6 space-y-5">
    {canViewChanges && <ClientCard title="Shared changes" icon={RefreshCw}>{changes.length === 0 ? <ClientEmpty>No changes are available to share.</ClientEmpty> : <div className="space-y-3">{changes.map((change) => <article key={change.id} className="rounded-lg border border-border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-medium text-slate-900">{change.title}</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-700">{clientHumanize(change.status)}</span></div>{change.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{change.description}</p>}<p className="mt-3 text-xs text-muted-foreground">Requested {clientDateLabel(change.requestedDate)} · {clientHumanize(change.priority)} priority</p>{canApprove && onDecide && DECIDABLE.has(change.status) && <ChangeDecision change={change} onDecide={onDecide} />}</article>)}</div>}</ClientCard>}
    {canSubmitRequest && <ClientChangeRequestForm onSubmit={onSubmitRequest} />}
  </div>;
}
