"use client";

import type { Task } from "@/types";

export function ChangeTaskSelector({ values, onChange, tasks }: { values: string[]; onChange: (values: string[]) => void; tasks: Task[] }) {
  const toggle = (id: string, checked: boolean) => onChange(checked ? [...new Set([...values, id])] : values.filter((value) => value !== id));
  return <fieldset className="rounded-lg border border-border p-4">
    <legend className="px-1 text-sm font-medium text-slate-800">Affected tasks <span className="font-normal text-slate-500">(optional)</span></legend>
    {tasks.length ? <div className="mt-1 max-h-52 space-y-3 overflow-y-auto">{tasks.map((task) => <label key={task.id} className="flex cursor-pointer items-start gap-3 text-sm text-slate-700"><input type="checkbox" checked={values.includes(task.id)} onChange={(event) => toggle(task.id, event.target.checked)} className="mt-0.5 size-4 accent-brand focus-visible:outline-2 focus-visible:outline-brand" /><span><span className="font-medium">{task.id}</span> — {task.title}</span></label>)}</div> : <p className="mt-1 text-sm text-muted-foreground">No tasks are available in this project yet. Leave this empty or link tasks later.</p>}
  </fieldset>;
}
