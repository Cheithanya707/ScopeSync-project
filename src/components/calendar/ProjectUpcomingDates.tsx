"use client";

import { useEffect, useState } from "react";
import { UpcomingDeadlines } from "@/components/calendar/UpcomingDeadlines";
import { localDateKey } from "@/lib/dates";
import { getProjectCalendarEvents } from "@/services/calendar/calendarService";
import type { CalendarEvent, Project } from "@/types";

export function ProjectUpcomingDates({ project, ownerId }: { project: Project; ownerId: string }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let current = true;
    void getProjectCalendarEvents(ownerId, project.id, project.workspaceId).then((items) => {
      if (current) setEvents(items);
    }).catch(() => {
      if (current) setError("Unable to load upcoming dates. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [ownerId, project]);
  if (loading) return <div role="status" className="rounded-xl border border-border bg-white p-5 text-sm text-muted-foreground">Loading upcoming dates…</div>;
  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>;
  const today = localDateKey();
  const nextByType = ["task_due", "project_deadline", "change_requested", "payment_due"].flatMap((type) =>
    events.find((event) => event.type === type && event.date >= today) ?? [],
  ).sort((a, b) => a.date.localeCompare(b.date));
  return <UpcomingDeadlines events={nextByType} title="Upcoming Dates" limit={3} />;
}
