import Link from "next/link";

const tabs = [
  ["Overview", ""], ["Requirements", "requirements"], ["Tasks", "tasks"], ["Changes", "changes"],
  ["Calendar", "calendar"], ["Documents", "documents"], ["Payments", "payments"], ["People", "people"],
] as const;

export function ProjectTabs({ projectId, active = "" }: { projectId: string; active?: string }) {
  return (
    <nav aria-label="Project sections" className="hide-scrollbar overflow-x-auto border-b border-border">
      <div className="flex min-w-max gap-6">
        {tabs.map(([label, segment]) => {
          const selected = segment === active;
          return (
            <Link
              key={label}
              href={segment ? `/projects/${projectId}/${segment}` : `/projects/${projectId}`}
              aria-current={selected ? "page" : undefined}
              className={`border-b-2 px-0.5 pb-3 text-sm font-medium ${selected ? "border-brand text-brand" : "border-transparent text-slate-500 hover:text-slate-900"}`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
