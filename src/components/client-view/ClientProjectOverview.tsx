import { CalendarDays, FolderKanban } from "lucide-react";
import { EVENT_PROJECT_TYPES } from "@/lib/constants/events";
import type { EventDetails, Project } from "@/types";
import { ClientCard, clientDateLabel, clientHumanize } from "@/components/client-view/ClientViewPrimitives";

export function ClientProjectOverview({
  project,
  eventDetails,
  progress,
}: {
  project: Pick<Project, "id" | "workspaceId" | "name" | "description" | "type" | "status" | "startDate" | "deadline">;
  eventDetails: Pick<EventDetails, "eventName" | "shortDescription" | "venue" | "startDate" | "endDate"> | null;
  progress: number | null;
}) {
  return <div className="mt-6 space-y-5">
    <ClientCard title="Project overview" icon={FolderKanban}>
      <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">Project</dt><dd className="mt-1 font-medium text-slate-900">{project.name}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Project type</dt><dd className="mt-1 font-medium text-slate-900">{clientHumanize(project.type)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-1 font-medium capitalize text-slate-900">{clientHumanize(project.status)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Start date</dt><dd className="mt-1 font-medium text-slate-900">{clientDateLabel(project.startDate)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Deadline</dt><dd className="mt-1 font-medium text-slate-900">{clientDateLabel(project.deadline)}</dd></div>
        {progress !== null && <div><dt className="text-xs text-muted-foreground">Project progress</dt><dd className="mt-1 font-semibold text-brand">{progress}%</dd><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} /></div></div>}
      </dl>
      <div className="mt-5 border-t border-border pt-4"><h3 className="text-sm font-medium text-slate-800">Description</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{project.description || "No description has been shared."}</p></div>
    </ClientCard>
    {eventDetails && EVENT_PROJECT_TYPES.has(project.type) && <ClientCard title={eventDetails.eventName} icon={CalendarDays}>
      <dl className="grid gap-4 sm:grid-cols-2">
        {eventDetails.shortDescription && <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Event information</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{eventDetails.shortDescription}</dd></div>}
        {eventDetails.venue && <div><dt className="text-xs text-muted-foreground">Venue</dt><dd className="mt-1 text-sm font-medium text-slate-900">{eventDetails.venue}</dd></div>}
        {eventDetails.startDate && <div><dt className="text-xs text-muted-foreground">Event dates</dt><dd className="mt-1 text-sm font-medium text-slate-900">{clientDateLabel(eventDetails.startDate)}{eventDetails.endDate ? ` – ${clientDateLabel(eventDetails.endDate)}` : ""}</dd></div>}
      </dl>
    </ClientCard>}
  </div>;
}
