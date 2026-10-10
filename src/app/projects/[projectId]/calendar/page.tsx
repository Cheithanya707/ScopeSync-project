"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { Button } from "@/components/ui/button";
import { useProjectPreview } from "@/hooks/useProjectPreview";
import { getProjectCalendarEvents } from "@/services/calendar/calendarService";
import type { CalendarEvent } from "@/types";
import { useEffect, useState } from "react";

export default function ProjectCalendarPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, loading: projectLoading, error: projectError, ownerId } = useProjectPreview(projectId);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!project) return;
    let current = true;
    void Promise.resolve().then(() => {
      if (current) {
        setLoadingEvents(true);
        setError("");
      }
      return getProjectCalendarEvents(ownerId, project.id, project.workspaceId);
    }).then((items) => {
      if (current) setEvents(items);
    }).catch(() => {
      if (current) setError("Unable to load calendar data. Please try again.");
    }).finally(() => {
      if (current) setLoadingEvents(false);
    });
    return () => { current = false; };
  }, [project, ownerId]);
  if (projectLoading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading project calendar…</div>;
  if (!project) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold">{projectError ? "Project unavailable" : "Project not found"}</h1><p className="mt-2 text-sm text-muted-foreground">{projectError || "This project is not available in this browser."}</p><Button asChild variant="outline" className="mt-5"><Link href="/projects">Back to projects</Link></Button></section>;
  return <div><div className="mb-5"><Link href={`/projects/${project.id}`} className="text-sm text-slate-500 hover:text-slate-900">{project.name}</Link><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Project Calendar</h1><p className="mt-2 text-sm text-muted-foreground">Track important dates for this project.</p></div><div className="mb-6"><ProjectTabs projectId={project.id} active="calendar" /></div><CalendarView events={events} projects={[project]} workspace={false} loading={loadingEvents} error={error} /></div>;
}
