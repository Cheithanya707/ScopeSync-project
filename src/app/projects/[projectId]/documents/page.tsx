"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DocumentManager } from "@/components/documents/DocumentManager";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { getProject } from "@/services/projects/projectStore";
import type { Project } from "@/types";

export default function ProjectDocumentsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const workspace = useWorkspace();
  const ownerId = user?.uid ?? "local-preview-user";
  const activeWorkspaceId = workspace.workspaceId ?? ownerId;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    void getProject(ownerId, activeWorkspaceId, projectId).then((item) => {
      if (current) setProject(item);
    }).catch(() => {
      if (current) setError("Unable to load this project from this browser.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [activeWorkspaceId, ownerId, projectId]);

  if (loading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading project…</div>;
  if (!project) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold text-slate-950">{error ? "Project unavailable" : "Project not found"}</h1><p className="mt-2 text-sm text-muted-foreground">{error || "This project may have been removed or belongs to another browser profile."}</p><Button asChild variant="outline" className="mt-5"><Link href="/projects">Back to projects</Link></Button></section>;

  return <div><div className="mb-7"><ProjectTabs projectId={project.id} active="documents" /></div><DocumentManager ownerId={ownerId} project={project} /></div>;
}
