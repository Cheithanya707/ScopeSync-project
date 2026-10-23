"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAiAnalysis, runAiAnalysis, type AiSeverity, type StoredAiAnalysis } from "@/services/scope/scopeService";

const severityStyle: Record<AiSeverity, string> = {
  info: "bg-slate-100 text-slate-700",
  low: "bg-blue-50 text-blue-800",
  medium: "bg-amber-50 text-amber-800",
  high: "bg-orange-50 text-orange-800",
  critical: "bg-red-50 text-red-800",
};

export function ProjectAiAnalysisPanel({ projectId }: { projectId: string | null }) {
  const [configured, setConfigured] = useState(true);
  const [stored, setStored] = useState<StoredAiAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const result = await getAiAnalysis(projectId);
      setConfigured(result.configured);
      setStored(result.latest);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load the AI analysis.");
    }
  }, [projectId]);

  useEffect(() => {
    setStored(null);
    setError("");
    void load();
  }, [load]);

  const run = async () => {
    if (!projectId) return;
    setBusy(true);
    setError("");
    try {
      setStored(await runAiAnalysis(projectId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The AI analysis failed.");
    } finally {
      setBusy(false);
    }
  };

  const analysis = stored?.analysis;
  return (
    <section aria-labelledby="ai-analysis-title" className="rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700"><Bot aria-hidden="true" className="size-5" /></span>
          <div>
            <h2 id="ai-analysis-title" className="font-semibold text-slate-950">AI-generated insights</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {projectId
                ? "An AI model reviews this project's requirements, tasks, changes, payments and scope drift. It only reads data and never changes anything."
                : "Select a single project above to run an AI analysis."}
            </p>
            {stored && <p className="mt-2 text-xs font-medium text-slate-500">Last analyzed {new Date(stored.createdAt).toLocaleString()} · {stored.model}</p>}
          </div>
        </div>
        <Button type="button" onClick={() => void run()} disabled={!projectId || busy || !configured}>
          <Sparkles aria-hidden="true" className={busy ? "animate-pulse" : ""} />{busy ? "Analyzing…" : stored ? "Re-run analysis" : "Run AI analysis"}
        </Button>
      </div>

      {!configured && <p role="status" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">AI is not enabled on this server yet. Add <code className="font-mono">GEMINI_API_KEY</code> to <code className="font-mono">backend/.env</code> and restart the API.</p>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {analysis && (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-3xl font-semibold tracking-tight text-slate-950">{analysis.healthScore}<span className="text-base font-normal text-muted-foreground">/100</span></p>
            <p className="max-w-2xl text-sm leading-6 text-slate-700">{analysis.summary}</p>
          </div>
          {analysis.risks.length > 0 && (
            <ul className="space-y-3">
              {analysis.risks.map((risk) => (
                <li key={risk.title} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${severityStyle[risk.severity]}`}>{risk.severity}</span>
                    <h3 className="font-medium text-slate-900">{risk.title}</h3>
                  </div>
                  {risk.detail && <p className="mt-2 text-sm leading-6 text-slate-600">{risk.detail}</p>}
                  {risk.recommendation && <p className="mt-2 text-sm leading-6 text-slate-800"><span className="font-medium">Recommendation: </span>{risk.recommendation}</p>}
                </li>
              ))}
            </ul>
          )}
          {analysis.nextActions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Suggested next actions</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{analysis.nextActions.map((action) => <li key={action}>{action}</li>)}</ul>
            </div>
          )}
          <p className="text-xs text-muted-foreground">AI output can be wrong. Review it before acting on it.</p>
        </div>
      )}
    </section>
  );
}
