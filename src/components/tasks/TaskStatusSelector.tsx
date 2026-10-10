"use client";

import { TASK_STATUSES } from "@/lib/constants/tasks";
import type { TaskStatus } from "@/types";

export function TaskStatusSelector({
  value,
  onChange,
  disabled = false,
  id,
}: {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <select
      aria-label="Change task status"
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as TaskStatus)}
      className="h-9 max-w-full rounded-lg border border-input bg-white px-2 text-xs font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
    >
      {TASK_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
    </select>
  );
}
