import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Settings2 } from "lucide-react";
import type { EventDetails, Project } from "@/types";
import { EVENT_TYPES } from "@/lib/constants/events";
import { EventNavigation } from "@/components/events/EventNavigation";

export function EventHeader({ project, details }: { project: Project; details: EventDetails | null }) {
  const eventType = EVENT_TYPES.find((item) => item.value === details?.eventType)?.label
    ?? EVENT_TYPES.find((item) => item.projectTypes.includes(project.type))?.label
    ?? "Event";
  return (
    <>
      <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden="true" className="size-4" />Back to project</Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand">{eventType}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{details?.eventName || project.name}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            {details?.startDate && <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-4" />{details.startDate}</span>}
            {details?.venue && <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-4" />{details.venue}</span>}
          </div>
        </div>
        <Link href={`/projects/${project.id}/event/setup`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Settings2 aria-hidden="true" className="size-4" />Event setup</Link>
      </div>
      <EventNavigation projectId={project.id} />
    </>
  );
}
