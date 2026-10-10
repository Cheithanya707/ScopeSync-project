import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { formatDateOnly, localDateKey } from "@/lib/dates";
import { calendarEventHref } from "@/services/calendar/calendarService";
import type { CalendarEvent } from "@/types";

export function OverdueItems({ events }: { events: CalendarEvent[] }) {
  const overdue = events.filter((event) =>
    event.type === "task_due" &&
    event.date < localDateKey() &&
    event.status !== "completed" &&
    event.status !== "cancelled",
  );
  return <section aria-labelledby="overdue-heading" className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
    <div className="flex items-center gap-2"><AlertCircle aria-hidden={true} className="size-5 text-amber-800" /><h2 id="overdue-heading" className="font-semibold text-slate-950">Overdue</h2></div>
    {overdue.length ? <ul className="mt-3 space-y-2">{overdue.map((event) => <li key={event.id}><Link href={calendarEventHref(event)} className="block rounded-lg border border-amber-200 bg-white/80 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><span className="block truncate text-sm font-medium text-slate-900">{event.title}</span><span className="mt-1 block text-xs text-amber-900">Due {formatDateOnly(event.date)} · {event.projectName}</span></Link></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No overdue tasks.</p>}
  </section>;
}
