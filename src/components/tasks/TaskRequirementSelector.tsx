"use client";

export interface RequirementOption {
  id: string;
  code: string;
  title: string;
}

export function TaskRequirementSelector({
  value,
  onChange,
  requirements,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  requirements: RequirementOption[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor="task-requirement" className="mb-1.5 block text-sm font-medium text-slate-800">Requirement <span className="font-normal text-slate-500">(optional)</span></label>
      <select id="task-requirement" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60">
        <option value="">No requirement</option>
        {requirements.map((requirement) => <option key={requirement.id} value={requirement.id}>{requirement.code} — {requirement.title}</option>)}
      </select>
      {requirements.length === 0 && <p className="mt-1 text-xs text-muted-foreground">No requirements are available in this project yet. You can create this as a project-level task.</p>}
    </div>
  );
}
