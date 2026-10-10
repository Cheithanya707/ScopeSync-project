"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TaskPriority } from "@/types";

export function ClientChangeRequestForm({ onSubmit }: { onSubmit: (data: { title: string; description: string; priority: TaskPriority }) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await onSubmit({ title, description, priority });
      setTitle("");
      setDescription("");
      setPriority("medium");
      setMessage("Your change request was submitted for the project team to review.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your change request could not be submitted.");
    } finally {
      setBusy(false);
    }
  };

  return <form onSubmit={(event) => void submit(event)} className="rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6">
    <h2 className="text-lg font-semibold text-slate-950">Request a Change</h2>
    <p className="mt-1 text-sm text-muted-foreground">Requests are reviewed by the project team and do not change the project automatically.</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><label htmlFor="client-change-title" className="mb-1.5 block text-sm font-medium text-slate-800">Title</label><Input id="client-change-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required disabled={busy} /></div>
      <div className="sm:col-span-2"><label htmlFor="client-change-description" className="mb-1.5 block text-sm font-medium text-slate-800">Description</label><textarea id="client-change-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={3000} required disabled={busy} className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand" /></div>
      <div><label htmlFor="client-change-priority" className="mb-1.5 block text-sm font-medium text-slate-800">Priority</label><select id="client-change-priority" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)} disabled={busy} className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
    </div>
    {message && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="mt-4"><Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit Request"}</Button></div>
  </form>;
}
