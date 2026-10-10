import { Banknote, CalendarDays, ListTodo, Repeat2 } from "lucide-react";
import { localDateKey } from "@/lib/dates";
import type { CalendarEvent } from "@/types";

export function TodaySummary({ events }: { events: CalendarEvent[] }) {
  const today = localDateKey();
  const todaysEvents = events.filter((event) => event.date === today);
  const counts = [
    { label: "Tasks Due", count: todaysEvents.filter((event) => event.type === "task_due").length, icon: ListTodo },
    { label: "Changes Requested", count: todaysEvents.filter((event) => event.type === "change_requested").length, icon: Repeat2 },
    { label: "Project Deadlines", count: todaysEvents.filter((event) => event.type === "project_deadline").length, icon: CalendarDays },
    { label: "Payments Due", count: todaysEvents.filter((event) => event.type === "payment_due").length, icon: Banknote },
  ];
  return <section aria-label="Today summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{counts.map(({ label, count, icon: Icon }) => <div key={label} className="flex items-center justify-between rounded-xl border border-border bg-white p-4"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold text-slate-950">{count}</p></div><Icon aria-hidden={true} className="size-5 text-slate-400" /></div>)}</section>;
}
