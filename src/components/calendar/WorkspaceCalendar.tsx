"use client";

import { useEffect, useState } from "react";
import { CalendarView } from "@/components/calendar/CalendarView";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { getWorkspaceCalendarEvents } from "@/services/calendar/calendarService";
import { getProjects } from "@/services/projects/projectStore";
import type { CalendarEvent, Project } from "@/types";

export function WorkspaceCalendar() {
  const { user } = useAuth();
  const workspace = useWorkspace();
  const ownerId = user?.uid ?? "local-preview-user";
  const activeWorkspaceId = workspace.workspaceId ?? ownerId;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!workspace.workspaceId) return;
    let current = true;
    void Promise.all([
      getWorkspaceCalendarEvents(ownerId, activeWorkspaceId),
      getProjects(ownerId, activeWorkspaceId),
    ]).then(([items, projectList]) => {
      if (!current) return;
      setEvents(items);
      setProjects(projectList);
    }).catch(() => {
      if (current) setError("Unable to load calendar data. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [activeWorkspaceId, ownerId, workspace.workspaceId]);
  const visibleEvents = workspace.workspaceId ? events : [];
  const visibleProjects = workspace.workspaceId ? projects : [];
  return <div><div className="mb-6"><p className="text-sm font-medium text-brand">Workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Calendar</h1><p className="mt-2 text-sm text-muted-foreground">Track project deadlines, task due dates, scope changes and pending payment dates.</p></div><CalendarView events={visibleEvents} projects={visibleProjects} workspace loading={Boolean(workspace.workspaceId) && loading} error={workspace.workspaceId ? error : ""} /></div>;
}
