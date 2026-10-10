"use client";

import { PROJECT_STATUSES } from "@/lib/constants";
import type { ProjectStatus } from "@/types";

export function ProjectStatusSelector({
  status,
  onChange,
  disabled = false,
}: {
  status: ProjectStatus;
  onChange: (status: ProjectStatus) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-medium text-slate-700">Status</span>
      <select
        aria-label="Change project status"
        value={status}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as ProjectStatus)}
        className="h-10 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
      >
        {PROJECT_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>
  );
}
