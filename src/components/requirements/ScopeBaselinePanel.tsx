"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectLiveUpdates } from "@/hooks/useProjectLiveUpdates";
import { ApiError } from "@/lib/apiClient";
import {
  createBaseline,
  downloadBlob,
  exportScopeCsv,
  getAuditTrail,
  getDrift,
  listBaselines,
  type AuditTrail,
  type BaselineSummary,
  type DriftLevel,
  type DriftResult,
} from "@/services/scope/scopeService";

const levelStyle: Record<DriftLevel, { badge: string; bar: string; label: string }> = {
  none: { badge: "bg-emerald-50 text-emerald-800", bar: "bg-emerald-500", label: "No drift" },
  low: { badge: "bg-blue-50 text-blue-800", bar: "bg-blue-500", label: "Low drift" },
  medium: { badge: "bg-amber-50 text-amber-800", bar: "bg-amber-500", label: "Medium drift" },
  high: { badge: "bg-red-50 text-red-800", bar: "bg-red-500", label: "High drift" },
};

function formatMoney(value: number, currency?: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(value);
  } catch {
    return String(value);
  }
}

const when = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export function ScopeBaselinePanel({ projectId, currency }: { projectId: string; currency?: string }) {
  const [baselines, setBaselines] = useState<BaselineSummary[]>([]);
  const [result, setResult] = useState<DriftResult | null>(null);
  const [audit, setAudit] = useState<AuditTrail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = useCallback(
    () => Promise.all([listBaselines(projectId), getDrift(projectId), getAuditTrail(projectId)]),
    [projectId],
  );

  const refresh = useCallback(async () => {
    try {
      const [list, drift, trail] = await load();
      setBaselines(list);
      setResult(drift);
      setAudit(trail);
      setError("");
    } catch (reason) {
      setError(reason instanceof ApiError && reason.status === 0
        ? "Baseline tracking needs the ScopeSync API to be running."
        : reason instanceof Error ? reason.message : "Unable to load scope tracking.");
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    let active = true;
    const loadInitialData = async () => {
      try {
        const [list, drift, trail] = await load();
        if (!active) return;
        setBaselines(list);
        setResult(drift);
        setAudit(trail);
        setError("");
      } catch (reason) {
        if (!active) return;
        setError(reason instanceof ApiError && reason.status === 0
          ? "Baseline tracking needs the ScopeSync API to be running."
          : reason instanceof Error ? reason.message : "Unable to load scope tracking.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadInitialData();
    return () => {
      active = false;
      clearTimeout(timer.current);
    };
  }, [load]);

  useProjectLiveUpdates(projectId, () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void refresh(), 400);
  });

  const lock = async () => {
    setBusy(true);
    setError("");
    try {
      await createBaseline(projectId, { name: name.trim() || undefined });
      setName("");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to lock the baseline.");
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = async () => {
    setBusy(true);
    try {
      downloadBlob(await exportScopeCsv(projectId), `scopesync-scope-history.csv`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to export the scope history.");
    } finally {
      setBusy(false);
    }
  };

  const style = levelStyle[result?.drift.level ?? "none"];
  const drift = result?.drift;

  return (
    <section aria-label="Scope baseline and drift" className="mt-6 rounded-xl border border-border bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Scope baseline &amp; drift</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Lock what was agreed, then see exactly how far the project has moved from it.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="baseline-name">Baseline name</label>
          <Input id="baseline-name" className="sm:w-48" maxLength={80} placeholder="Baseline name (optional)" value={name} onChange={(event) => setName(event.target.value)} />
          <Button onClick={() => void lock()} disabled={busy}><Lock aria-hidden="true" />Lock baseline</Button>
          <Button variant="outline" onClick={() => void exportCsv()} disabled={busy}><Download aria-hidden="true" />Export CSV</Button>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {loading && <p role="status" className="mt-4 text-sm text-muted-foreground">Loading scope tracking…</p>}

      {!loading && !result && !error && (
        <p className="mt-5 rounded-lg border border-dashed border-slate-300 p-5 text-sm leading-6 text-muted-foreground">
          No baseline yet. When the client and team agree on the requirements, lock them here. Every later change is measured against that agreed scope.
        </p>
      )}

      {drift && result && (
        <div className="mt-5">
          {!result.baselineIntact && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">This baseline no longer matches its saved fingerprint and may have been altered.</p>}
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-4xl font-semibold tracking-tight text-slate-950">{drift.driftPercent}%</p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style.badge}`}>{style.label}</span>
            <span className="text-sm text-muted-foreground">vs {result.baseline.name} · locked {when(result.baseline.createdAt)}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={drift.driftPercent} aria-label="Scope drift">
            <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${drift.driftPercent}%` }} />
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Added", drift.added.length],
              ["Removed", drift.removed.length],
              ["Modified", drift.modified.length],
              ["Pending changes", drift.pendingChanges],
              ["Approved changes", drift.approvedChanges],
              ["Extra hours", drift.extraHours],
              ["Extra cost", formatMoney(drift.extraCost, currency)],
              ["Baseline size", drift.baselineCount],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">{value}</dd>
              </div>
            ))}
          </dl>
          {(drift.added.length + drift.removed.length + drift.modified.length) > 0 && (
            <details className="mt-4 rounded-lg border border-border p-3 text-sm">
              <summary className="cursor-pointer font-medium text-slate-900">What changed since the baseline</summary>
              <ul className="mt-3 space-y-1.5 text-slate-700">
                {drift.added.map((item) => <li key={`a-${item.id}`}><span className="font-mono text-xs text-emerald-700">+ {item.code}</span> {item.title}</li>)}
                {drift.removed.map((item) => <li key={`r-${item.id}`}><span className="font-mono text-xs text-red-700">− {item.code}</span> {item.title}</li>)}
                {drift.modified.map((item) => <li key={`m-${item.id}`}><span className="font-mono text-xs text-amber-700">~ {item.code}</span> {item.title} <span className="text-xs text-muted-foreground">({item.fields.join(", ")})</span></li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      {baselines.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-900">Baseline history</h3>
          <ul className="mt-2 divide-y divide-border rounded-lg border border-border text-sm">
            {baselines.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <span className="font-medium text-slate-900">v{item.version} · {item.name}</span>
                <span className="text-xs text-muted-foreground">{item.itemCount} requirements · {when(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {audit && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Audit trail</h3>
            {audit.verification.valid
              ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"><ShieldCheck aria-hidden="true" className="size-3.5" />Verified · {audit.total} entries</span>
              : <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800"><ShieldAlert aria-hidden="true" className="size-3.5" />Tampering detected at entry #{audit.verification.brokenAtSeq}</span>}
          </div>
          {audit.entries.length === 0
            ? <p className="mt-2 text-sm text-muted-foreground">Changes to requirements, tasks, change requests and payments will be recorded here.</p>
            : <ul className="mt-2 max-h-72 divide-y divide-border overflow-y-auto rounded-lg border border-border text-sm">
                {audit.entries.slice(0, 15).map((entry) => (
                  <li key={entry.seq} className="px-3 py-2">
                    <p className="text-slate-900">{entry.summary}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">#{entry.seq} · {when(entry.at)}{entry.actorEmail ? ` · ${entry.actorEmail}` : ""}</p>
                  </li>
                ))}
              </ul>}
        </div>
      )}
    </section>
  );
}
