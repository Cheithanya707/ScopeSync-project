"use client";

import { useParams } from "next/navigation";
import { PaymentManager } from "@/components/payments/PaymentManager";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { useProjectPreview } from "@/hooks/useProjectPreview";

export default function ProjectPaymentsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, loading, error, ownerId } = useProjectPreview(projectId);
  if (loading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading project payments…</div>;
  if (!project) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold text-slate-950">{error ? "Project unavailable" : "Project not found"}</h1><p className="mt-2 text-sm text-muted-foreground">{error || "This project is not available in this browser."}</p></section>;
  return <div><div className="mb-7"><ProjectTabs projectId={project.id} active="payments" /></div><PaymentManager ownerId={ownerId} project={project} /></div>;
}
