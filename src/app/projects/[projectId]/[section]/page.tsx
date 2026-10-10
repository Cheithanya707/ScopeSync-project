"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock3 } from "lucide-react";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { getProject } from "@/services/projects/projectStore";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";

const sections = ["requirements", "tasks", "changes", "calendar", "documents", "payments"] as const;
const labels: Record<(typeof sections)[number], string> = {
  requirements: "Requirements", tasks: "Tasks", changes: "Changes", calendar: "Calendar", documents: "Documents", payments: "Payments",
};

export default function ProjectFeaturePlaceholderPage() {
  const { projectId, section } = useParams<{ projectId: string; section: string }>();
  const { user } = useAuth();
  const workspace = useWorkspace();
  const activeWorkspaceId = workspace.workspaceId ?? user?.uid ?? "local-preview-user";
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const sectionKey = sections.includes(section as (typeof sections)[number]) ? section as (typeof sections)[number] : "requirements";

  useEffect(() => {
    let current = true;
    void Promise.resolve().then(() => getProject(user?.uid ?? "local-preview-user", activeWorkspaceId, projectId)).then((project) => {
      if (current) setProjectName(project?.name ?? "");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [activeWorkspaceId, projectId, user?.uid]);

  if (loading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading project…</div>;
  if (!projectName) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold">Project not found</h1><Link className="mt-4 inline-block text-sm text-brand" href="/projects">Back to projects</Link></section>;

  return (
    <div>
      <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden="true" className="size-4" />{projectName}</Link>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">{labels[sectionKey]}</h1>
      <div className="mt-7"><ProjectTabs projectId={projectId} active={sectionKey} /></div>
      <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Clock3 aria-hidden="true" className="size-6" /></span>
        <h2 className="mt-4 text-lg font-semibold text-slate-950">{labels[sectionKey]} is not available</h2>
        <p className="mt-2 text-sm text-muted-foreground">This project section is currently unavailable in this environment.</p>
        <Link href={`/projects/${projectId}`} className="mt-5 inline-flex text-sm font-medium text-brand hover:underline">Back to overview</Link>
      </section>
    </div>
  );
}
