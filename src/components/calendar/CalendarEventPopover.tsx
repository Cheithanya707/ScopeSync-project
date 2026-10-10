"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Banknote, CalendarDays, Check, Clock3, ListTodo, Repeat2, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CALENDAR_EVENT_TYPES } from "@/lib/constants/calendar";
import { formatDateOnly } from "@/lib/dates";
import { calendarEventHref } from "@/services/calendar/calendarService";
import type { CalendarEvent } from "@/types";

const icons = { project_deadline: CalendarDays, task_due: ListTodo, change_requested: Repeat2, payment_due: Banknote, event_schedule: Timer };

export function CalendarEventPopover({ event, onClose }: { event: CalendarEvent | null; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!event) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    const closeOnEscape = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus();
    };
  }, [event, onClose]);
  if (!event) return null;
  const Icon = icons[event.type];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="calendar-event-title" className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl" onKeyDown={(keyboardEvent) => {
      if (keyboardEvent.key !== "Tab") return;
      const focusable = keyboardEvent.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (keyboardEvent.shiftKey && document.activeElement === first) {
        keyboardEvent.preventDefault();
        last?.focus();
      } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
        keyboardEvent.preventDefault();
        first?.focus();
      }
    }}>
      <div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700"><Icon aria-hidden={true} className="size-5" /></span><div><p className="text-sm font-medium text-slate-500">{CALENDAR_EVENT_TYPES.find((item) => item.value === event.type)?.label}</p><h2 id="calendar-event-title" className="mt-1 text-lg font-semibold text-slate-950">{event.title}</h2></div></div><Button ref={closeButtonRef} type="button" variant="ghost" size="icon" aria-label="Close event details" onClick={onClose}><X aria-hidden={true} /></Button></div>
      <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
        <div className="flex items-center gap-2"><CalendarDays aria-hidden={true} className="size-4 text-slate-400" /><dt className="text-muted-foreground">Date</dt><dd className="ml-auto font-medium text-slate-800">{formatDateOnly(event.date)}</dd></div>
        <div className="flex items-center gap-2"><Check aria-hidden={true} className="size-4 text-slate-400" /><dt className="text-muted-foreground">Project</dt><dd className="ml-auto truncate font-medium text-slate-800">{event.projectName}</dd></div>
        {event.status && <div className="flex items-center gap-2"><Clock3 aria-hidden={true} className="size-4 text-slate-400" /><dt className="text-muted-foreground">Status</dt><dd className="ml-auto font-medium capitalize text-slate-800">{event.status.replaceAll("_", " ")}</dd></div>}
        {event.priority && <div className="flex items-center gap-2"><dt className="text-muted-foreground">Priority</dt><dd className="ml-auto font-medium capitalize text-slate-800">{event.priority}</dd></div>}
        {event.description && <div><dt className="text-muted-foreground">Description</dt><dd className="mt-1 whitespace-pre-wrap text-slate-800">{event.description}</dd></div>}
      </dl>
      <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Close</Button><Button asChild><Link href={calendarEventHref(event)}>View</Link></Button></div>
    </section>
  </div>;
}
