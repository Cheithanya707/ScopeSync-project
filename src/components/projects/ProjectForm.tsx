"use client";

import { PROJECT_CURRENCIES, PROJECT_STATUSES, PROJECT_TYPES } from "@/lib/constants";
import type { ProjectFormValues } from "@/types";
import { Input } from "@/components/ui/input";

export const emptyProjectForm: ProjectFormValues = {
  name: "",
  description: "",
  type: "",
  clientName: "",
  startDate: "",
  deadline: "",
  budget: "",
  currency: "INR",
  status: "planning",
};

export function ProjectForm({
  values,
  onChange,
  errors,
  includeStatus = true,
  includeType = true,
  startDateLabel = "Start date",
  deadlineLabel = "Expected deadline",
}: {
  values: ProjectFormValues;
  onChange: (values: ProjectFormValues) => void;
  errors: Partial<Record<keyof ProjectFormValues, string>>;
  includeStatus?: boolean;
  includeType?: boolean;
  startDateLabel?: string;
  deadlineLabel?: string;
}) {
  const field = (key: keyof ProjectFormValues, value: string) => onChange({ ...values, [key]: value });
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-800";
  const error = (key: keyof ProjectFormValues) => errors[key] && <p role="alert" className="mt-1 text-sm text-red-700">{errors[key]}</p>;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="project-name">Project name <span className="text-red-700">*</span></label>
        <Input id="project-name" autoComplete="off" maxLength={100} value={values.name} onChange={(event) => field("name", event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "project-name-error" : undefined} />
        {errors.name && <p id="project-name-error" role="alert" className="mt-1 text-sm text-red-700">{errors.name}</p>}
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="project-description">Project description <span className="font-normal text-slate-500">(optional)</span></label>
        <textarea id="project-description" rows={4} maxLength={3000} value={values.description} onChange={(event) => field("description", event.target.value)} aria-invalid={Boolean(errors.description)} className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">{error("description")}<span>{values.description.length}/3000</span></div>
      </div>
      <div>
        <label className={labelClass} htmlFor="project-client">Client / organization <span className="font-normal text-slate-500">(optional)</span></label>
        <Input id="project-client" maxLength={150} value={values.clientName} onChange={(event) => field("clientName", event.target.value)} aria-invalid={Boolean(errors.clientName)} />
        {error("clientName")}
      </div>
      <div>
        <label className={labelClass} htmlFor="project-status">Status</label>
        <select id="project-status" value={values.status} onChange={(event) => field("status", event.target.value)} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" disabled={!includeStatus}>
          {PROJECT_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="project-start">{startDateLabel} <span className="font-normal text-slate-500">(optional)</span></label>
        <Input id="project-start" type="date" value={values.startDate} onChange={(event) => field("startDate", event.target.value)} aria-invalid={Boolean(errors.startDate)} />
        {error("startDate")}
      </div>
      <div>
        <label className={labelClass} htmlFor="project-deadline">{deadlineLabel} <span className="font-normal text-slate-500">(optional)</span></label>
        <Input id="project-deadline" type="date" value={values.deadline} onChange={(event) => field("deadline", event.target.value)} aria-invalid={Boolean(errors.deadline)} />
        {error("deadline")}
      </div>
      <div>
        <label className={labelClass} htmlFor="project-budget">Budget <span className="font-normal text-slate-500">(optional)</span></label>
        <Input id="project-budget" inputMode="decimal" type="number" min="0.01" step="0.01" value={values.budget} onChange={(event) => field("budget", event.target.value)} aria-invalid={Boolean(errors.budget)} />
        {error("budget")}
      </div>
      <div>
        <label className={labelClass} htmlFor="project-currency">Currency</label>
        <select id="project-currency" value={values.currency} onChange={(event) => field("currency", event.target.value)} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          {PROJECT_CURRENCIES.map((currency) => <option key={currency}>{currency}</option>)}
        </select>
      </div>
      {includeType && <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="project-type">Project type</label>
        <select id="project-type" value={values.type} onChange={(event) => field("type", event.target.value)} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="">Choose a type</option>
          {PROJECT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
        {error("type")}
      </div>}
    </div>
  );
}
