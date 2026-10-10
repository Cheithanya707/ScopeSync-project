"use client";

export interface ChangeRequirementOption { id: string; code: string; title: string }

export function ChangeRequirementSelector({ values, onChange, requirements }: { values: string[]; onChange: (values: string[]) => void; requirements: ChangeRequirementOption[] }) {
  const toggle = (id: string, checked: boolean) => onChange(checked ? [...new Set([...values, id])] : values.filter((value) => value !== id));
  return <fieldset className="rounded-lg border border-border p-4">
    <legend className="px-1 text-sm font-medium text-slate-800">Affected requirements <span className="font-normal text-slate-500">(optional)</span></legend>
    {requirements.length ? <div className="mt-1 space-y-3">{requirements.map((item) => <label key={item.id} className="flex cursor-pointer items-start gap-3 text-sm text-slate-700"><input type="checkbox" checked={values.includes(item.id)} onChange={(event) => toggle(item.id, event.target.checked)} className="mt-0.5 size-4 accent-brand focus-visible:outline-2 focus-visible:outline-brand" /><span><span className="font-medium">{item.code}</span> — {item.title}</span></label>)}</div> : <p className="mt-1 text-sm text-muted-foreground">No requirements are available in this project yet. Leave this empty or link requirements later.</p>}
  </fieldset>;
}
