import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { relativeDateLabel } from "@/lib/dates";
import { calendarEventHref } from "@/services/calendar/calendarService";
import type { CalendarEvent } from "@/types";

export function UpcomingDeadlines({ events, title = "Upcoming Deadlines", limit = 7 }: { events: CalendarEvent[]; title?: string; limit?: number }) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const upcoming = events.filter((event) => event.date >= todayKey).slice(0, limit);
  return <section aria-labelledby={`upcoming-${title.replaceAll(" ", "-")}`} className="rounded-xl border border-border bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3"><div><h2 id={`upcoming-${title.replaceAll(" ", "-")}`} className="font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm text-muted-foreground">The next dates on your calendar.</p></div><CalendarDays aria-hidden={true} className="size-5 text-slate-400" /></div>
    {upcoming.length ? <ul className="mt-4 divide-y divide-border">{upcoming.map((event) => <li key={event.id}><Link href={calendarEventHref(event)} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-900">{event.title}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{event.projectName}</span></span><span className="shrink-0 text-right text-xs font-medium text-slate-600">{relativeDateLabel(event.date).label}<ArrowRight aria-hidden={true} className="ml-1 inline size-3.5" /></span></Link></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">No upcoming dates.</p>}
  </section>;
}
