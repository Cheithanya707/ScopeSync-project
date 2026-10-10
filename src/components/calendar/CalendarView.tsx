"use client";

import { useCallback, useMemo, useState } from "react";
import { Banknote, CalendarDays, ListTodo, Repeat2, Timer } from "lucide-react";
import { CalendarEvent } from "@/components/calendar/CalendarEvent";
import { CalendarEventPopover } from "@/components/calendar/CalendarEventPopover";
import { CalendarFilters, type CalendarFilterValues } from "@/components/calendar/CalendarFilters";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { CalendarEmptyState } from "@/components/calendar/CalendarEmptyState";
import { OverdueItems } from "@/components/calendar/OverdueItems";
import { TodaySummary } from "@/components/calendar/TodaySummary";
import { UpcomingDeadlines } from "@/components/calendar/UpcomingDeadlines";
import { CALENDAR_EVENT_TYPES, type CalendarViewMode } from "@/lib/constants/calendar";
import { formatDateOnly, localDateKey } from "@/lib/dates";
import type { CalendarEvent as CalendarEventData, Project } from "@/types";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const initialFilters: CalendarFilterValues = { type: "all", projectId: "all", taskStatus: "all", changeStatus: "all", query: "" };
const eventIcons = { project_deadline: CalendarDays, task_due: ListTodo, change_requested: Repeat2, payment_due: Banknote, event_schedule: Timer };

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function weekStart(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function dateTitle(date: Date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(date);
}

export function CalendarView({
  events,
  projects,
  workspace,
  error,
  loading,
}: {
  events: CalendarEventData[];
  projects: Project[];
  workspace: boolean;
  error?: string;
  loading?: boolean;
}) {
  const [date, setDate] = useState(() => new Date());
  const [view, setView] = useState<CalendarViewMode>("month");
  const [selectedDate, setSelectedDate] = useState(() => localDateKey());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventData | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const filteredEvents = useMemo(() => {
    const query = filters.query.trim().toLocaleLowerCase();
    return events.filter((event) =>
      (filters.type === "all" || event.type === filters.type) &&
      (filters.projectId === "all" || event.projectId === filters.projectId) &&
      (event.type !== "task_due" || filters.taskStatus === "all" || event.status === filters.taskStatus) &&
      (event.type !== "change_requested" || filters.changeStatus === "all" || event.status === filters.changeStatus) &&
      (!query || `${event.title} ${event.projectName}`.toLocaleLowerCase().includes(query))
    );
  }, [events, filters]);
  const dateList = useMemo(() => {
    if (view === "day") return [new Date(`${localDateKey(date)}T00:00:00`)];
    if (view === "week") return Array.from({ length: 7 }, (_, index) => addDays(weekStart(date), index));
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const start = weekStart(first);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const count = Math.ceil((Math.ceil((last.getTime() - start.getTime()) / 86400000) + 1) / 7) * 7;
    return Array.from({ length: count }, (_, index) => addDays(start, index));
  }, [date, view]);
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEventData[]>();
    for (const event of filteredEvents) grouped.set(event.date, [...(grouped.get(event.date) ?? []), event]);
    return grouped;
  }, [filteredEvents]);
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];
  const closeEvent = useCallback(() => setSelectedEvent(null), []);

  const chooseDate = (key: string) => {
    setSelectedDate(key);
    const [year, month, day] = key.split("-").map(Number);
    setDate(new Date(year, month - 1, day));
  };

  return <div className="space-y-5">
    <CalendarFilters value={filters} onChange={setFilters} projects={projects} workspace={workspace} />
    {loading ? <div role="status" className="rounded-xl border border-border bg-white p-12 text-center text-sm text-muted-foreground">Loading calendar data…</div> : error ? <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p> : <>
      {!filteredEvents.length && (events.length === 0
        ? <CalendarEmptyState />
        : <p role="status" className="rounded-lg border border-border bg-white p-4 text-sm text-muted-foreground">No calendar items match these filters.</p>)}
      <TodaySummary events={filteredEvents} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-label={`${view} calendar`} className="min-w-0 rounded-xl border border-border bg-white p-3 shadow-sm sm:p-5">
          <CalendarHeader date={date} view={view} onDateChange={(next) => { setDate(next); setSelectedDate(localDateKey(next)); }} onViewChange={setView} />
          <div aria-label="Calendar event types" className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-b border-border pb-3">{CALENDAR_EVENT_TYPES.map(({ value, label }) => {
            const Icon = eventIcons[value];
            return <span key={value} className="inline-flex items-center gap-1.5 text-xs text-slate-600"><Icon aria-hidden={true} className="size-3.5" />{label}</span>;
          })}</div>
          {view === "month" && <div className="mt-4 grid grid-cols-7 border-l border-t border-border">{weekdays.map((day) => <div key={day} aria-label={day} className="border-b border-r border-border bg-slate-50 px-0.5 py-2 text-center text-[10px] font-medium text-slate-600 sm:px-2 sm:text-xs"><span aria-hidden={true} className="sm:hidden">{day.slice(0, 2)}</span><span aria-hidden={true} className="hidden sm:inline">{day}</span></div>)}{dateList.map((day) => {
            const key = localDateKey(day);
            const items = eventsByDate.get(key) ?? [];
            const inMonth = day.getMonth() === date.getMonth();
            return <div key={key} className={`min-h-[84px] min-w-0 border-b border-r border-border p-1 sm:min-h-[120px] sm:p-2 ${inMonth ? "" : "bg-slate-50/70"}`}>
              <button type="button" onClick={() => chooseDate(key)} aria-label={`Select ${dateTitle(day)}`} aria-pressed={selectedDate === key} className={`mb-1 flex size-7 items-center justify-center rounded-full text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:size-8 sm:text-sm ${selectedDate === key ? "bg-brand font-semibold text-white" : inMonth ? "text-slate-800 hover:bg-slate-100" : "text-slate-400"}`}>{day.getDate()}</button>
              <div className="space-y-1">{items.slice(0, 2).map((event) => <CalendarEvent key={event.id} event={event} compact onSelect={setSelectedEvent} />)}</div>
              {items.length > 2 && <button type="button" onClick={() => chooseDate(key)} className="mt-1 text-[10px] font-medium text-brand hover:underline sm:text-xs">{items.length - 2} more</button>}
            </div>;
          })}</div>}
          {view === "week" && <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">{dateList.map((day) => {
            const key = localDateKey(day);
            const items = eventsByDate.get(key) ?? [];
            return <section key={key} className={`min-w-0 rounded-lg border p-2 ${selectedDate === key ? "border-brand ring-1 ring-brand/30" : "border-border"}`}><button type="button" onClick={() => chooseDate(key)} aria-pressed={selectedDate === key} className="w-full rounded text-left text-xs font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">{weekdays[(day.getDay() + 6) % 7]}, {day.getDate()}</button><div className="mt-2 space-y-1">{items.length ? items.map((event) => <CalendarEvent key={event.id} event={event} compact onSelect={setSelectedEvent} />) : <p className="py-1 text-xs text-slate-400">No events</p>}</div></section>;
          })}</div>}
          {view === "day" && <div className="mt-4 space-y-2">{selectedEvents.length ? selectedEvents.map((event) => <CalendarEvent key={event.id} event={event} onSelect={setSelectedEvent} />) : <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-muted-foreground">No events for this date.</p>}</div>}
          <div className="mt-4 border-t border-border pt-4"><h3 className="font-semibold text-slate-950">{formatDateOnly(selectedDate, { dateStyle: "full" })}</h3>{selectedEvents.length ? <ul className="mt-2 space-y-2">{selectedEvents.map((event) => <li key={event.id}><CalendarEvent event={event} onSelect={setSelectedEvent} /><p className="ml-1 mt-1 text-xs text-muted-foreground">{CALENDAR_EVENT_TYPES.find((item) => item.value === event.type)?.label} · {event.projectName}{event.status ? ` · ${event.status.replaceAll("_", " ")}` : ""}</p></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">No events for this date.</p>}</div>
        </section>
        <aside className="space-y-4"><UpcomingDeadlines events={filteredEvents} limit={7} /><OverdueItems events={filteredEvents} /></aside>
      </div>
    </>}
    <CalendarEventPopover event={selectedEvent} onClose={closeEvent} />
  </div>;
}
