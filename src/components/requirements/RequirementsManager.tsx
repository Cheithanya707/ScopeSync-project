"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, CircleDot, FileText, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Project, Requirement, RequirementFormValues, RequirementStatus } from "@/types";
import { createRequirement, getRequirements, updateRequirement } from "@/services/requirements/requirementStore";
import { ScopeBaselinePanel } from "@/components/requirements/ScopeBaselinePanel";

const statuses: { value: RequirementStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "under_review", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

const emptyValues: RequirementFormValues = {
  title: "",
  description: "",
  acceptanceCriteria: "",
  type: "functional",
  priority: "medium",
  status: "draft",
};

const labelClass = "mb-1.5 block text-sm font-medium text-slate-800";
const statusClass: Record<RequirementStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  under_review: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-800",
  archived: "bg-slate-100 text-slate-500",
};

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function RequirementsManager({ project, ownerId }: { project: Project; ownerId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [editing, setEditing] = useState<Requirement | null>(null);
  const [values, setValues] = useState<RequirementFormValues>(emptyValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RequirementStatus | "all">("all");

  const reload = async () => {
    setError("");
    setRequirements(await getRequirements(ownerId, project));
  };

  useEffect(() => {
    let current = true;
    void getRequirements(ownerId, project).then((items) => {
      if (current) setRequirements(items);
    }).catch(() => {
      if (current) setError("Unable to load requirements. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [ownerId, project]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return requirements.filter((item) =>
      (status === "all" || item.status === status) &&
      (!term || `${item.code} ${item.title} ${item.description ?? ""} ${item.acceptanceCriteria ?? ""}`.toLowerCase().includes(term))
    );
  }, [requirements, query, status]);

  const openCreate = () => {
    setEditing(null);
    setValues(emptyValues);
    setError("");
    setFeedback("");
    setDialogOpen(true);
    dialogRef.current?.showModal();
  };

  const openEdit = (requirement: Requirement) => {
    setEditing(requirement);
    setValues({
      title: requirement.title,
      description: requirement.description ?? "",
      acceptanceCriteria: requirement.acceptanceCriteria ?? "",
      type: requirement.type,
      priority: requirement.priority,
      status: requirement.status,
    });
    setError("");
    setFeedback("");
    setDialogOpen(true);
    dialogRef.current?.showModal();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editing) await updateRequirement(ownerId, project, editing.id, values);
      else await createRequirement(ownerId, project, values);
      await reload();
      setFeedback(editing ? "Requirement updated." : "Requirement created.");
      dialogRef.current?.close();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save this requirement.");
    } finally {
      setSaving(false);
    }
  };

  const counts = {
    total: requirements.filter((item) => item.status !== "archived").length,
    approved: requirements.filter((item) => item.status === "approved").length,
    review: requirements.filter((item) => item.status === "under_review").length,
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">{project.name}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Requirements</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Capture what this project must deliver, define clear acceptance criteria, and keep approval status visible.</p>
        </div>
        <Button onClick={openCreate}><Plus aria-hidden="true" />Add requirement</Button>
      </div>

      {error && !dialogOpen && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {feedback && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{feedback}</p>}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Metric label="Active requirements" value={counts.total} icon={FileText} />
        <Metric label="Approved" value={counts.approved} icon={CheckCircle2} />
        <Metric label="In review" value={counts.review} icon={CircleDot} />
      </div>

      <ScopeBaselinePanel projectId={project.id} currency={project.currency} />

      <section aria-label="Search and filter requirements" className="mt-6 rounded-xl border border-border bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
          <label className="relative block">
            <span className="sr-only">Search requirements</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title, ID, or details" />
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as RequirementStatus | "all")} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50">
              {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      {loading ? (
        <div role="status" className="mt-6 rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading requirements…</div>
      ) : error && requirements.length === 0 ? (
        <div role="alert" className="mt-6 rounded-xl border border-border bg-white p-10 text-center text-sm text-red-800">{error}</div>
      ) : filtered.length ? (
        <ul className="mt-5 grid gap-3">
          {filtered.map((requirement) => (
            <li id={requirement.id} key={requirement.id} className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{requirement.code}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[requirement.status]}`}>{humanize(requirement.status)}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{humanize(requirement.priority)} priority</span>
                  </div>
                  <h2 className="mt-2 break-words text-base font-semibold text-slate-950">{requirement.title}</h2>
                  {requirement.description && <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{requirement.description}</p>}
                  {requirement.acceptanceCriteria && <div className="mt-3 rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Acceptance criteria</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{requirement.acceptanceCriteria}</p></div>}
                  <p className="mt-3 text-xs text-muted-foreground">{humanize(requirement.type)} requirement</p>
                </div>
                <Button variant="outline" className="w-full shrink-0 sm:w-auto" onClick={() => openEdit(requirement)}>Edit</Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-blue-50 text-brand"><FileText aria-hidden="true" className="size-6" /></span>
          <h2 className="mt-4 text-lg font-semibold text-slate-950">{requirements.length ? "No matching requirements" : "No requirements yet"}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{requirements.length ? "Try another search or status filter." : "Add the first requirement to make project expectations clear and keep delivery aligned."}</p>
          {requirements.length === 0 && <Button className="mt-5" onClick={openCreate}><Plus aria-hidden="true" />Add requirement</Button>}
        </div>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="requirement-dialog-title"
        onClose={() => { setDialogOpen(false); setError(""); }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-slate-950/45"
      >
        <form onSubmit={submit} className="p-5 sm:p-7">
          <h2 id="requirement-dialog-title" className="text-xl font-semibold text-slate-950">{editing ? `Edit ${editing.code}` : "Add a requirement"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Define the outcome and how the team will know it is complete.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="requirement-title" className={labelClass}>Title <span className="text-red-700">*</span></label>
              <Input id="requirement-title" autoFocus maxLength={180} required value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} />
            </div>
            <div>
              <label htmlFor="requirement-type" className={labelClass}>Type</label>
              <select id="requirement-type" value={values.type} onChange={(event) => setValues({ ...values, type: event.target.value as RequirementFormValues["type"] })} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm">
                {["functional", "non_functional", "technical", "design", "security", "performance", "event", "other"].map((item) => <option key={item} value={item}>{humanize(item)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="requirement-priority" className={labelClass}>Priority</label>
              <select id="requirement-priority" value={values.priority} onChange={(event) => setValues({ ...values, priority: event.target.value as RequirementFormValues["priority"] })} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm">
                {["low", "medium", "high", "critical"].map((item) => <option key={item} value={item}>{humanize(item)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="requirement-status" className={labelClass}>Status</label>
              <select id="requirement-status" value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value as RequirementStatus })} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm">
                {statuses.filter((item) => item.value !== "all").map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="requirement-description" className={labelClass}>Description</label>
              <textarea id="requirement-description" rows={3} maxLength={3000} value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:ring-3 focus-visible:ring-ring/50" />
              <p className="mt-1 text-right text-xs text-muted-foreground">{values.description.length}/3000</p>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="requirement-criteria" className={labelClass}>Acceptance criteria</label>
              <textarea id="requirement-criteria" rows={3} maxLength={3000} value={values.acceptanceCriteria} onChange={(event) => setValues({ ...values, acceptanceCriteria: event.target.value })} placeholder="What must be true for this requirement to be accepted?" className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:ring-3 focus-visible:ring-ring/50" />
              <p className="mt-1 text-right text-xs text-muted-foreground">{values.acceptanceCriteria.length}/3000</p>
            </div>
          </div>
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <div className="mt-6 flex flex-col-reverse justify-end gap-3 border-t border-border pt-4 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => dialogRef.current?.close()}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create requirement"}</Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof FileText }) {
  return <div className="flex items-center justify-between rounded-xl border border-border bg-white p-4"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{value}</p></div><span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-brand"><Icon aria-hidden="true" className="size-5" /></span></div>;
}
