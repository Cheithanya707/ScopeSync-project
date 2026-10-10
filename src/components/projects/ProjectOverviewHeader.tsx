"use client";

import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROJECT_TYPES } from "@/lib/constants";
import type { Project } from "@/types";
import { ProjectStatusSelector } from "./ProjectStatusSelector";

export function ProjectOverviewHeader({
  project,
  onStatusChange,
  statusUpdating,
  canManage,
}: {
  project: Project;
  onStatusChange: (status: Project["status"]) => void;
  statusUpdating: boolean;
  canManage: boolean;
}) {
  const type = PROJECT_TYPES.find((item) => item.value === project.type)?.label ?? "Other";
  return (
    <header>
      <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft aria-hidden="true" className="size-4" /> All projects
      </Link>
      <div className="mt-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-medium text-brand">
            {project.projectKind ? `${project.projectKind === "personal" ? "Personal" : "Freelancer"} project · ` : ""}
            {project.projectSubcategory || type}
            {project.clientName ? ` · ${project.clientName}` : ""}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{project.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canManage && <ProjectStatusSelector status={project.status} onChange={onStatusChange} disabled={statusUpdating} />}
          {canManage && <Button variant="outline" asChild><Link href={`/projects/${project.id}/edit`}><Pencil aria-hidden="true" />Edit project</Link></Button>}
        </div>
      </div>
    </header>
  );
}
