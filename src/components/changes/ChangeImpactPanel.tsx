"use client";

import { useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveChangeImpact, suggestChangeImpactWithAi, type ImpactSuggestion } from "@/services/scope/scopeService";
import type { ScopeChange } from "@/types";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-800";

export function ChangeImpactPanel({ projectId, change }: { projectId: string; change: ScopeChange }) {
  const [hours, setHours] = useState(String(change.impact?.extraHours ?? 0));
  const [cost, setCost] = useState(String(change.impact?.extraCost ?? 0));
  const [days, setDays] = useState(String(change.impact?.scheduleDays ?? 0));
  const [note, setNote] = useState(change.impact?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<ImpactSuggestion | null>(null);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await saveChangeImpact(projectId, change.id, {
        extraHours: Number(hours) || 0,
        extraCost: Number(cost) || 0,
        scheduleDays: Number(days) || 0,
        note,
      });
      setMessage("Impact saved. It now counts toward this project's scope drift.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save the impact.");
    } finally {
      setSaving(false);
    }
  };

  const suggest = async () => {
    setSuggesting(true);
    setError("");
    setMessage("");
    setCopied(false);
    try {
      const result = await suggestChangeImpactWithAi(projectId, change.id);
      setSuggestion(result);
      setHours(String(result.extraHours));
      setDays(String(result.scheduleDays));
      setMessage("AI estimate filled in. Review the numbers, add the cost, then save.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The AI estimate failed.");
    } finally {
      setSuggesting(false);
    }
  };

  const copyMessage = async () => {
    if (!suggestion?.clientMessage) return;
    try {
      await navigator.clipboard.writeText(suggestion.clientMessage);
      setCopied(true);
    } catch {
      setError("Copy failed. Select the text and copy it manually.");
    }
  };

  return <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Impact of this change</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Record the extra time and money this request needs before it is approved.</p>
      </div>
      <Button type="button" variant="outline" onClick={() => void suggest()} disabled={suggesting}><Sparkles aria-hidden="true" className={suggesting ? "animate-pulse" : ""} />{suggesting ? "Estimating…" : "Suggest with AI"}</Button>
    </div>
    <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-3">
      <div>
        <label htmlFor="impact-hours" className={labelClass}>Extra hours</label>
        <Input id="impact-hours" type="number" min={0} max={10000} step="0.25" value={hours} onChange={(event) => setHours(event.target.value)} />
      </div>
      <div>
        <label htmlFor="impact-cost" className={labelClass}>Extra cost</label>
        <Input id="impact-cost" type="number" min={0} step="1" value={cost} onChange={(event) => setCost(event.target.value)} />
      </div>
      <div>
        <label htmlFor="impact-days" className={labelClass}>Schedule days</label>
        <Input id="impact-days" type="number" min={0} max={3650} step="1" value={days} onChange={(event) => setDays(event.target.value)} />
      </div>
      <div className="sm:col-span-3">
        <label htmlFor="impact-note" className={labelClass}>Note</label>
        <textarea id="impact-note" rows={2} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" />
      </div>
      {suggestion && <div className="rounded-lg bg-violet-50/60 p-4 text-sm leading-6 text-slate-700 sm:col-span-3">
        <p className="font-medium text-slate-900">AI rationale</p>
        <p className="mt-1">{suggestion.rationale}</p>
        {suggestion.clientMessage && <>
          <p className="mt-3 font-medium text-slate-900">Draft message to the client</p>
          <p className="mt-1 whitespace-pre-wrap">{suggestion.clientMessage}</p>
          <button type="button" onClick={() => void copyMessage()} className="mt-2 text-sm font-medium text-brand hover:underline">{copied ? "Copied" : "Copy message"}</button>
        </>}
      </div>}
      {error && <p role="alert" className="sm:col-span-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {message && <p role="status" className="sm:col-span-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      <div className="sm:col-span-3"><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save impact"}</Button></div>
    </form>
  </section>;
}
