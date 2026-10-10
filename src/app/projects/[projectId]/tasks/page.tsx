"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ProjectTasksPage } from "@/components/tasks/ProjectTasksPage";
import { Button } from "@/components/ui/button";
import { useProjectPreview } from "@/hooks/useProjectPreview";

export default function ProjectTasksRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, loading, error, ownerId, currentUser } = useProjectPreview(projectId);

  if (loading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading project…</div>;
  if (!project) return (
    <section className="rounded-xl border border-border bg-white p-8 text-center">
      <h1 className="text-xl font-semibold text-slate-950">{error ? "Project unavailable" : "Project not found"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error || "This project is not available in this browser."}</p>
      <Button asChild variant="outline" className="mt-5"><Link href="/projects">Back to projects</Link></Button>
    </section>
  );

  return <ProjectTasksPage project={project} ownerId={ownerId} currentUserId={currentUser?.uid ?? ownerId} />;
}
