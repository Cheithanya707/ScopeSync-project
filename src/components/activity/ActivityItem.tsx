import Link from "next/link";
import { createElement } from "react";
import { MemberAvatar } from "@/components/people/MemberAvatar";
import type { Activity } from "@/types";
import {
  formatActivityDescription,
  formatActivityTime,
  getActivityEntityLabel,
  getActivityIcon,
  getActivityLabel,
  getActivityRoute,
} from "@/lib/utils/activityUtils";

export function ActivityItem({ activity, compact = false }: { activity: Activity; compact?: boolean }) {
  const Icon = getActivityIcon(activity.action);
  const route = getActivityRoute(activity);
  const projectName = activity.metadata && typeof activity.metadata.projectName === "string"
    ? activity.metadata.projectName
    : null;
  return (
    <article aria-label={formatActivityDescription(activity)} className={`relative flex gap-3 ${compact ? "py-3" : "py-4"}`}>
      <span role="img" aria-label={`${activity.actorName} avatar`} className="relative z-10 shrink-0"><MemberAvatar name={activity.actorName} photoURL={activity.actorPhotoURL} size="sm" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-6 text-slate-800">
          <span className="font-semibold text-slate-950">{activity.actorName}</span>{" "}
          <span className="text-slate-600">{getActivityLabel(activity.action).toLowerCase()}</span>{" "}
          {route ? (
            <Link href={route} className="font-medium text-brand underline-offset-4 hover:underline">{activity.entityName}</Link>
          ) : (
            <span className="font-medium text-slate-900">{activity.entityName}</span>
          )}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">{createElement(Icon, { "aria-hidden": true, className: "size-3.5" })}{getActivityEntityLabel(activity.entityType)}</span>
          {projectName && activity.projectId && activity.entityType !== "project" && (
            <>
              <span aria-hidden="true">·</span>
              <Link href={`/projects/${encodeURIComponent(activity.projectId)}`} className="text-brand hover:underline">{projectName}</Link>
            </>
          )}
          <span aria-hidden="true">·</span>
          <time>{formatActivityTime(activity.createdAt)}</time>
        </div>
      </div>
    </article>
  );
}
