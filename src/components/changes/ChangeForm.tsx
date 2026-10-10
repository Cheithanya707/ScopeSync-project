"use client";

import { CHANGE_PRIORITIES } from "@/lib/constants/changes";
import type { ScopeChangeFormValues, Task } from "@/types";
import { Input } from "@/components/ui/input";
import { ChangeRequirementSelector, type ChangeRequirementOption } from "./ChangeRequirementSelector";
import { ChangeSourceSelector } from "./ChangeSourceSelector";
import { ChangeTaskSelector } from "./ChangeTaskSelector";
import { ChangeTypeSelector } from "./ChangeTypeSelector";

export const emptyChangeForm = (): ScopeChangeFormValues => ({
  title: "",
  description: "",
  type: "new_requirement",
  priority: "medium",
  source: "client",
  affectedRequirementIds: [],
  affectedTaskIds: [],
  requestedDate: new Date().toLocaleDateString("en-CA"),
});

export type ChangeFormErrors = Partial<Record<"title" | "description" | "requestedDate", string>>;
const labelClass = "mb-1.5 block text-sm font-medium text-slate-800";

export function ChangeForm({
  value,
  onChange,
  errors = {},
  requirements,
  tasks,
}: {
  value: ScopeChangeFormValues;
  onChange: (value: ScopeChangeFormValues) => void;
  errors?: ChangeFormErrors;
  requirements: ChangeRequirementOption[];
  tasks: Task[];
}) {
  const set = <K extends keyof ScopeChangeFormValues>(key: K, next: ScopeChangeFormValues[K]) => onChange({ ...value, [key]: next });
  return <div className="grid gap-5 sm:grid-cols-2">
    <div className="sm:col-span-2"><label htmlFor="change-title" className={labelClass}>Title <span className="text-red-700">*</span></label><Input id="change-title" maxLength={200} value={value.title} onChange={(event) => set("title", event.target.value)} aria-invalid={Boolean(errors.title)} />{errors.title && <p role="alert" className="mt-1 text-sm text-red-700">{errors.title}</p>}</div>
    <div className="sm:col-span-2"><label htmlFor="change-description" className={labelClass}>Description <span className="text-red-700">*</span></label><textarea id="change-description" rows={5} maxLength={5000} value={value.description} onChange={(event) => set("description", event.target.value)} aria-invalid={Boolean(errors.description)} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" /><div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{errors.description && <span role="alert" className="text-red-700">{errors.description}</span>}</span><span>{value.description.length}/5000</span></div></div>
    <div><label htmlFor="change-type" className={labelClass}>Change type <span className="text-red-700">*</span></label><ChangeTypeSelector value={value.type} onChange={(next) => set("type", next)} /></div>
    <div><label htmlFor="change-priority" className={labelClass}>Priority <span className="text-red-700">*</span></label><select id="change-priority" value={value.priority} onChange={(event) => set("priority", event.target.value as ScopeChangeFormValues["priority"])} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">{CHANGE_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
    <div><label htmlFor="change-source" className={labelClass}>Source <span className="text-red-700">*</span></label><ChangeSourceSelector value={value.source} onChange={(next) => set("source", next)} /></div>
    <div><label htmlFor="change-requested-date" className={labelClass}>Requested date <span className="text-red-700">*</span></label><Input id="change-requested-date" type="date" value={value.requestedDate} onChange={(event) => set("requestedDate", event.target.value)} aria-invalid={Boolean(errors.requestedDate)} />{errors.requestedDate && <p role="alert" className="mt-1 text-sm text-red-700">{errors.requestedDate}</p>}</div>
    <div className="sm:col-span-2"><ChangeRequirementSelector values={value.affectedRequirementIds} onChange={(next) => set("affectedRequirementIds", next)} requirements={requirements} /></div>
    <div className="sm:col-span-2"><ChangeTaskSelector values={value.affectedTaskIds} onChange={(next) => set("affectedTaskIds", next)} tasks={tasks} /></div>
  </div>;
}
