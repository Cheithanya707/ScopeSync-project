import type { Activity } from "@/types";
import { getActivityDateGroup } from "@/lib/utils/activityUtils";
import { ActivityItem } from "@/components/activity/ActivityItem";

const GROUP_ORDER = ["Today", "Yesterday", "Earlier This Week", "Older"] as const;

export function ActivityTimeline({ activities, loading = false }: { activities: Activity[]; loading?: boolean }) {
  if (loading) {
    return (
      <div role="status" aria-label="Loading activity" className="space-y-5 rounded-xl border border-border bg-white p-5">
        {[0, 1, 2, 3].map((item) => <div key={item} className="flex animate-pulse gap-3"><span className="size-9 rounded-full bg-slate-100" /><span className="mt-2 h-4 flex-1 rounded bg-slate-100" /></div>)}
      </div>
    );
  }
  if (!activities.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <h2 className="font-semibold text-slate-900">No activity yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Important workspace and project actions will appear here.</p>
      </div>
    );
  }

  const grouped = new Map<string, Activity[]>();
  activities.forEach((activity) => {
    const group = getActivityDateGroup(activity.createdAt);
    grouped.set(group, [...(grouped.get(group) ?? []), activity]);
  });
  return (
    <div className="space-y-6">
      {GROUP_ORDER.filter((group) => grouped.has(group)).map((group) => (
        <section key={group} aria-labelledby={`activity-${group.toLowerCase().replaceAll(" ", "-")}`} className="rounded-xl border border-border bg-white p-5 sm:p-6">
          <h2 id={`activity-${group.toLowerCase().replaceAll(" ", "-")}`} className="text-sm font-semibold text-slate-900">{group}</h2>
          <div className="relative mt-2 divide-y divide-slate-100 before:absolute before:bottom-5 before:left-[17px] before:top-5 before:border-l before:border-slate-200 before:content-['']">
            {grouped.get(group)?.map((activity) => <ActivityItem key={activity.id} activity={activity} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
