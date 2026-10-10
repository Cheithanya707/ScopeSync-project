import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { PROJECT_TYPES } from "@/lib/constants";
import type { Project } from "@/types";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { deadlineDateLabel, formatDateOnly } from "@/lib/dates";

export function ProjectCard({ project }: { project: Project }) {
  const type = PROJECT_TYPES.find((item) => item.value === project.type)?.label ?? "Other";
  const budget = project.budget == null
    ? "No budget"
    : new Intl.NumberFormat(undefined, { style: "currency", currency: project.currency, maximumFractionDigits: 0 }).format(project.budget);
  return (
    <Link href={`/projects/${project.id}`} className="group rounded-xl border border-border bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand"><FolderKanban aria-hidden="true" className="size-5" /></span>
        <ProjectStatusBadge status={project.status} />
      </div>
      <h2 className="mt-4 line-clamp-1 font-semibold text-slate-950 group-hover:text-brand">{project.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{type}</p>
      <dl className="mt-5 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-border pt-4 text-sm">
        <div><dt className="text-xs text-muted-foreground">Client</dt><dd className="mt-1 truncate text-slate-800">{project.clientName || "—"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Deadline</dt><dd className={`mt-1 ${project.deadline && deadlineDateLabel(project.deadline) === "Overdue" ? "font-medium text-amber-800" : "text-slate-800"}`}>{deadlineDateLabel(project.deadline)}</dd></div>
        <div className="col-span-2"><dt className="text-xs text-muted-foreground">Budget</dt><dd className="mt-1 text-slate-800">{budget}</dd></div>
        <div className="col-span-2"><dt className="text-xs text-muted-foreground">Created</dt><dd className="mt-1 text-slate-800">{formatDateOnly(project.createdAt.slice(0, 10))}</dd></div>
      </dl>
    </Link>
  );
}
