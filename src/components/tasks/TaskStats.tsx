import { CircleCheck, CircleDashed, CirclePause, ListTodo, LoaderCircle } from "lucide-react";
import type { Task } from "@/types";

export function TaskStats({ tasks }: { tasks: Task[] }) {
  const stats = [
    { label: "Total Tasks", value: tasks.length, icon: ListTodo },
    { label: "Todo", value: tasks.filter((task) => task.status === "todo").length, icon: CircleDashed },
    { label: "In Progress", value: tasks.filter((task) => task.status === "in_progress").length, icon: LoaderCircle },
    { label: "Blocked", value: tasks.filter((task) => task.status === "blocked").length, icon: CirclePause },
    { label: "Completed", value: tasks.filter((task) => task.status === "completed").length, icon: CircleCheck },
  ];
  return (
    <section aria-label="Task statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {stats.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-xl border border-border bg-white p-4">
          <div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground sm:text-sm">{label}</p><Icon aria-hidden={true} className="size-4 shrink-0 text-slate-400" /></div>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
      ))}
    </section>
  );
}
