"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { RequirementsManager } from "@/components/requirements/RequirementsManager";
import { useProjectPreview } from "@/hooks/useProjectPreview";

export default function ProjectRequirementsRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, loading, error, ownerId } = useProjectPreview(projectId);
  if (loading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading project…</div>;
  if (!project) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold">{error ? "Project unavailable" : "Project not found"}</h1><p className="mt-2 text-sm text-muted-foreground">{error || "This project is not available in this browser."}</p><Button asChild variant="outline" className="mt-5"><Link href="/projects">Back to projects</Link></Button></section>;
  return <div><Link href={`/projects/${project.id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden="true" className="size-4" />{project.name}</Link><div className="mt-5"><ProjectTabs projectId={project.id} active="requirements" /></div><div className="mt-7"><RequirementsManager project={project} ownerId={ownerId} /></div></div>;
}
