"use client";

import { TASK_TYPES } from "@/lib/constants/tasks";
import type { TaskType } from "@/types";

export function TaskTypeSelector({ value, onChange }: { value: TaskType; onChange: (value: TaskType) => void }) {
  return (
    <select id="task-type" value={value} onChange={(event) => onChange(event.target.value as TaskType)} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      {TASK_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
    </select>
  );
}
