"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Bot, CheckCircle2, Clock3, RefreshCw, ShieldAlert, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { isDateBeforeToday, parseDateOnly } from "@/lib/dates";
import {
  calculateDeadlineRisk,
  calculateOpenChanges,
  calculateRequirementCoverage,
  calculateUnassignedTasks,
  getChangeHealth,
  getDeadlineHealth,
  getHealthLabel,
  getPaymentHealth,
  getRequirementHealth,
  getScopeGrowthSignal,
  getScopeHealth,
  getTaskHealth,
  getTeamHealth,
} from "@/lib/utils/aiInsightUtils";
import { getAIProjectInputs } from "@/services/ai/aiInsightService";
import type { AIProjectInput, HealthStatus } from "@/types";

const healthStyles: Record<HealthStatus, string> = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-800",
  needs_attention: "border-amber-200 bg-amber-50 text-amber-800",
  at_risk: "border-orange-200 bg-orange-50 text-orange-800",
  critical: "border-red-200 bg-red-50 text-red-800",
};

function HealthBadge({ status }: { status: HealthStatus | null }) {
  return status
    ? <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${healthStyles[status]}`}>{getHealthLabel(status)}</span>
    : <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">Not available</span>;
}

function MetricCard({ label, value, detail, icon: Icon, tone = "blue" }: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Bot;
  tone?: "blue" | "amber" | "red" | "green";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    green: "bg-emerald-50 text-emerald-700",
  };
  return (
    <article className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <span className={`flex size-10 items-center justify-center rounded-lg ${tones[tone]}`}><Icon aria-hidden="true" className="size-5" /></span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{detail}</p>
    </article>
  );
}

function HealthRow({ label, status, detail }: { label: string; status: HealthStatus | null; detail: string }) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
      <HealthBadge status={status} />
    </div>
  );
}

function AnalysisPanel() {
  return (
    <section aria-labelledby="ai-analysis-title" className="rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700"><Bot aria-hidden="true" className="size-5" /></span>
        <div>
          <h2 id="ai-analysis-title" className="font-semibold text-slate-950">AI-generated insights</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">AI analysis is not connected yet. No external AI provider is called, and no AI-generated insight is being presented as real.</p>
          <p className="mt-3 text-xs font-medium text-slate-500">Last analyzed: Not analyzed yet</p>
        </div>
      </div>
    </section>
  );
}

function projectSignals(input: AIProjectInput) {
  const tasks = input.tasks.filter((task) => task.status !== "cancelled");
  const completed = tasks.filter((task) => task.status === "completed").length;
  const overdue = calculateDeadlineRisk(input.tasks).filter((item) => item.level === "critical");
  const dueSoon = calculateDeadlineRisk(input.tasks).filter((item) => item.level === "high" || item.level === "medium");
  const openChanges = calculateOpenChanges(input.scopeChanges);
  const unassigned = calculateUnassignedTasks(input.tasks);
  const overduePayments = input.payments.filter((payment) =>
    payment.status === "pending" && payment.dueDate && parseDateOnly(payment.dueDate) && isDateBeforeToday(payment.dueDate),
  );
  return { tasks, completed, overdue, dueSoon, openChanges, unassigned, overduePayments };
}

function getRecommendations(input: AIProjectInput): string[] {
  const signal = projectSignals(input);
  const recommendations: string[] = [];
  if (signal.openChanges.length) recommendations.push(`Review ${signal.openChanges.length} open scope change${signal.openChanges.length === 1 ? "" : "s"} and record a decision.`);
  if (signal.overdue.length) recommendations.push(`Re-plan ${signal.overdue.length} overdue task${signal.overdue.length === 1 ? "" : "s"} with their owners.`);
  if (signal.unassigned.length) recommendations.push(`Assign ${signal.unassigned.length} unassigned task${signal.unassigned.length === 1 ? "" : "s"} to an active team member.`);
  if (signal.dueSoon.length) recommendations.push(`Check the ${signal.dueSoon.length} task${signal.dueSoon.length === 1 ? "" : "s"} due within the next seven days.`);
  if (signal.overduePayments.length) recommendations.push(`Follow up on ${signal.overduePayments.length} pending payment${signal.overduePayments.length === 1 ? "" : "s"} past its due date.`);
  if (!recommendations.length) recommendations.push("No immediate risks were detected in the local task, change, payment, and team records.");
  return recommendations;
}

export function AIInsightsDashboard() {
  const { user } = useAuth();
  const ownerId = user?.uid ?? "local-preview-user";
  const [inputs, setInputs] = useState<AIProjectInput[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const results = await getAIProjectInputs(ownerId);
      setInputs(results);
      setRefreshedAt(new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load local project insights.");
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  const effectiveProjectId = inputs.some((item) => item.project?.id === selectedProjectId) ? selectedProjectId : "all";
  const visibleInputs = useMemo(
    () => effectiveProjectId === "all" ? inputs : inputs.filter((item) => item.project?.id === effectiveProjectId),
    [inputs, effectiveProjectId],
  );
  const combined: AIProjectInput = useMemo(() => ({
    requirements: visibleInputs.flatMap((item) => item.requirements),
    tasks: visibleInputs.flatMap((item) => item.tasks),
    scopeChanges: visibleInputs.flatMap((item) => item.scopeChanges),
    payments: visibleInputs.flatMap((item) => item.payments),
    members: visibleInputs.flatMap((item) => item.members),
  }), [visibleInputs]);
  const signal = projectSignals(combined);
  const coverage = calculateRequirementCoverage(combined.requirements, combined.tasks);
  const requirementHealth = getRequirementHealth(combined.requirements, combined.tasks);
  const approvedRequirementCount = combined.requirements.filter((requirement) => requirement.status === "approved").length;
  const requirementCoverageDetail = approvedRequirementCount
    ? `${coverage.covered} of ${coverage.approved} approved requirements are linked to tasks.`
    : "No approved requirements are available to assess yet.";
  const status = getScopeHealth(combined);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">Workspace overview</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">AI Insights</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A transparent, rules-based view of project health using records stored by the backend.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="insights-project-filter">Filter insights by project</label>
          <select id="insights-project-filter" value={effectiveProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} className="h-10 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <option value="all">All projects</option>
            {inputs.map(({ project }) => project && <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <Button type="button" variant="outline" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw aria-hidden="true" className={`size-4 ${loading ? "animate-spin" : ""}`} />Refresh data
          </Button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-sm">
        <span className="text-sm font-medium text-slate-700">Project health</span>
        <HealthBadge status={visibleInputs.length ? status : null} />
        <span className="text-xs text-muted-foreground">Based on available local signals; requirements are not included in the score.</span>
        <span className="ml-auto text-xs text-muted-foreground">{refreshedAt ? `Data refreshed ${refreshedAt}` : "Data has not been refreshed"}</span>
      </div>

      {loading && !inputs.length ? (
        <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading local project records…</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Projects monitored" value={visibleInputs.length} detail={effectiveProjectId === "all" ? "Projects in this browser workspace" : "Selected project"} icon={CheckCircle2} tone="blue" />
            <MetricCard label="Task completion" value={signal.tasks.length ? `${Math.round((signal.completed / signal.tasks.length) * 100)}%` : "—"} detail={`${signal.completed} of ${signal.tasks.length} non-cancelled tasks completed`} icon={ArrowUpRight} tone="green" />
            <MetricCard label="Open change requests" value={signal.openChanges.length} detail="New or under review" icon={ArrowDownRight} tone={signal.openChanges.length ? "amber" : "green"} />
            <MetricCard label="Deadline risks" value={signal.overdue.length + signal.dueSoon.length} detail={`${signal.overdue.length} overdue · ${signal.dueSoon.length} due within 7 days`} icon={Clock3} tone={signal.overdue.length ? "red" : "amber"} />
          </div>

          <AnalysisPanel />

          <div className="grid gap-6 xl:grid-cols-2">
            <section aria-labelledby="health-breakdown-title" className="rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div><h2 id="health-breakdown-title" className="font-semibold text-slate-950">Health breakdown</h2><p className="mt-1 text-sm text-muted-foreground">Deterministic checks; unavailable data is not counted as zero.</p></div>
                <ShieldAlert aria-hidden="true" className="size-5 text-slate-400" />
              </div>
              <div className="mt-4">
                <HealthRow label="Scope signals" status={getScopeHealth(combined)} detail={`${signal.openChanges.length} open changes · ${getScopeGrowthSignal(combined.scopeChanges)} approved scope-addition type signals`} />
                <HealthRow label="Requirements" status={requirementHealth} detail={requirementCoverageDetail} />
                <HealthRow label="Tasks" status={getTaskHealth(combined.tasks)} detail={`${signal.tasks.length} active tasks · ${signal.unassigned.length} unassigned`} />
                <HealthRow label="Deadlines" status={getDeadlineHealth(combined.tasks)} detail={`${signal.overdue.length} overdue · ${signal.dueSoon.length} due in the next 7 days`} />
                <HealthRow label="Change requests" status={getChangeHealth(combined.scopeChanges)} detail={`${signal.openChanges.length} awaiting review or decision`} />
                <HealthRow label="Payments" status={getPaymentHealth(combined.payments)} detail={`${signal.overduePayments.length} pending payments past due; currencies are not combined`} />
                <HealthRow label="Team coverage" status={getTeamHealth(combined)} detail={`${combined.members.filter((member) => member.status === "active").length} active project team members`} />
              </div>
              <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">Requirement coverage: {approvedRequirementCount ? `${coverage.percentage}% (${coverage.covered} of ${coverage.approved} approved requirements linked to tasks)` : "not applicable — approve requirements to begin tracking delivery coverage"}.</p>
            </section>

            <section aria-labelledby="recommendations-title" className="rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div><h2 id="recommendations-title" className="font-semibold text-slate-950">Suggested next actions</h2><p className="mt-1 text-sm text-muted-foreground">Generated from visible project records, not by AI.</p></div>
                <AlertTriangle aria-hidden="true" className="size-5 text-amber-500" />
              </div>
              <ul className="mt-4 space-y-3">
                {visibleInputs.length ? getRecommendations(combined).map((recommendation) => <li key={recommendation} className="flex gap-3 rounded-lg border border-slate-100 p-3 text-sm leading-6 text-slate-700"><CheckCircle2 aria-hidden="true" className="mt-1 size-4 shrink-0 text-brand" />{recommendation}</li>) : <li className="rounded-lg bg-slate-50 p-4 text-sm text-muted-foreground">Create a project to see recommendations from its records.</li>}
                {visibleInputs.length > 0 && getTeamHealth(combined) !== "healthy" && <li className="flex gap-3 rounded-lg border border-slate-100 p-3 text-sm leading-6 text-slate-700"><UsersRound aria-hidden="true" className="mt-1 size-4 shrink-0 text-brand" />Confirm every active task has an owner and the project team is up to date.</li>}
              </ul>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">Recommendations never change projects, tasks, payments, or change requests automatically.</p>
            </section>
          </div>

          <section aria-labelledby="project-health-title" className="rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="project-health-title" className="font-semibold text-slate-950">Project health</h2><p className="mt-1 text-sm text-muted-foreground">Open a project to investigate its deterministic signals.</p></div>
              <ShieldAlert aria-hidden="true" className="size-5 text-slate-400" />
            </div>
            {visibleInputs.length ? (
              <div className="mt-4 divide-y divide-slate-100">
                {visibleInputs.map((input) => {
                  const project = input.project;
                  if (!project) return null;
                  const itemSignal = projectSignals(input);
                  return <div key={project.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{project.name}</p><p className="mt-1 text-xs text-muted-foreground">{itemSignal.tasks.length} tasks · {itemSignal.openChanges.length} open changes · {itemSignal.overdue.length} overdue tasks</p></div>
                    <HealthBadge status={getScopeHealth(input)} />
                  </div>;
                })}
              </div>
            ) : <div className="mt-4 rounded-lg bg-slate-50 p-6 text-center text-sm text-muted-foreground">No project data is available in this browser yet.</div>}
          </section>

          <section aria-labelledby="risks-title" className="rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6">
            <div><h2 id="risks-title" className="font-semibold text-slate-950">Signals to review</h2><p className="mt-1 text-sm text-muted-foreground">Items are derived from project dates and statuses stored by the backend.</p></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {signal.overdue.slice(0, 5).map(({ task, daysUntilDue }) => <div key={task.id} className="flex gap-3 rounded-lg border border-red-100 bg-red-50/60 p-3"><Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-red-600" /><div><p className="text-sm font-medium text-slate-800">{task.title}</p><p className="mt-1 text-xs text-red-700">Overdue by {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) === 1 ? "" : "s"}</p></div></div>)}
              {signal.openChanges.slice(0, 5).map((change) => <div key={change.id} className="flex gap-3 rounded-lg border border-amber-100 bg-amber-50/60 p-3"><AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-600" /><div><p className="text-sm font-medium text-slate-800">{change.title}</p><p className="mt-1 text-xs text-amber-800">Change request · {change.status === "new" ? "New" : "Under review"}</p></div></div>)}
              {!signal.overdue.length && !signal.openChanges.length && <p className="rounded-lg bg-slate-50 p-4 text-sm text-muted-foreground md:col-span-2">No overdue tasks or open changes found in the selected records.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
