"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function EventNavigation({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  const items = [
    ["Overview", `${base}/event`],
    ["Requirements", `${base}/requirements`],
    ["Tasks", `${base}/tasks`],
    ["Changes", `${base}/changes`],
    ["People", `${base}/people`],
    ["Participants", `${base}/event/participants`],
    ["Teams", `${base}/event/teams`],
    ["Schedule", `${base}/event/schedule`],
    ["Documents", `${base}/documents`],
    ["Payments", `${base}/payments`],
    ["Activity", `/activity?projectId=${encodeURIComponent(projectId)}`],
  ] as const;
  return (
    <nav aria-label="Event sections" className="hide-scrollbar mt-6 overflow-x-auto border-b border-border">
      <div className="flex min-w-max gap-5">
        {items.map(([label, href]) => {
          const target = href.split("?")[0];
          const active = pathname === target || (label === "Overview" && pathname === `${base}/event`);
          return <Link key={label} href={href} aria-current={active ? "page" : undefined} className={`border-b-2 px-0.5 pb-3 text-sm font-medium ${active ? "border-brand text-brand" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{label}</Link>;
        })}
      </div>
    </nav>
  );
}
