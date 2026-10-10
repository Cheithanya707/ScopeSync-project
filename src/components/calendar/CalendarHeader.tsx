"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CALENDAR_VIEWS, type CalendarViewMode } from "@/lib/constants/calendar";

const viewLabels: Record<CalendarViewMode, string> = { month: "Month", week: "Week", day: "Day" };

export function CalendarHeader({
  date,
  view,
  onDateChange,
  onViewChange,
}: {
  date: Date;
  view: CalendarViewMode;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarViewMode) => void;
}) {
  const move = (amount: number) => {
    const next = new Date(date);
    if (view === "month") next.setMonth(next.getMonth() + amount, 1);
    else next.setDate(next.getDate() + amount * (view === "week" ? 7 : 1));
    onDateChange(next);
  };
  const periodLabel = view === "day"
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(date)
    : view === "week"
      ? `${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(date.getFullYear(), date.getMonth(), date.getDate() - ((date.getDay() + 6) % 7)))} – ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(date.getFullYear(), date.getMonth(), date.getDate() - ((date.getDay() + 6) % 7) + 6))}`
      : new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date);
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" onClick={() => onDateChange(new Date())}>Today</Button>
      <div className="flex">
        <Button type="button" size="icon" variant="outline" aria-label="Previous period" onClick={() => move(-1)}><ChevronLeft aria-hidden={true} /></Button>
        <Button type="button" size="icon" variant="outline" aria-label="Next period" className="ml-1" onClick={() => move(1)}><ChevronRight aria-hidden={true} /></Button>
      </div>
      <h2 aria-live="polite" className="ml-1 text-lg font-semibold text-slate-950">{periodLabel}</h2>
    </div>
    <div role="group" aria-label="Calendar view" className="inline-flex w-fit rounded-lg border border-border bg-slate-50 p-1">
      {CALENDAR_VIEWS.map((item) => <button key={item} type="button" aria-pressed={view === item} onClick={() => onViewChange(item)} className={`rounded-md px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${view === item ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>{viewLabels[item]}</button>)}
    </div>
  </div>;
}
