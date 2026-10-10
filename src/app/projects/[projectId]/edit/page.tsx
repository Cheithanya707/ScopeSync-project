"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectForm, emptyProjectForm } from "@/components/projects/ProjectForm";
import { getProject, updateProject } from "@/services/projects/projectStore";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { validateProjectForm } from "@/lib/projectValidation";
import type { Project, ProjectFormValues } from "@/types";

export default function EditProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const workspace = useWorkspace();
  const ownerId = user?.uid ?? "local-preview-user";
  const activeWorkspaceId = workspace.workspaceId ?? ownerId;
  const [project, setProject] = useState<Project | null>(null);
  const [values, setValues] = useState<ProjectFormValues>(emptyProjectForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<ReturnType<typeof validateProjectForm>>({});

  useEffect(() => {
    let current = true;
    void Promise.resolve().then(() => getProject(ownerId, activeWorkspaceId, projectId)).then((item) => {
      if (!current) return;
      setProject(item);
      if (item) setValues({
        name: item.name, description: item.description ?? "", type: item.type,
        clientName: item.clientName ?? "", startDate: item.startDate ?? "", deadline: item.deadline ?? "",
        budget: item.budget == null ? "" : String(item.budget), currency: item.currency, status: item.status,
      });
    }).catch(() => {
      if (current) setError("Unable to load this project. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [activeWorkspaceId, ownerId, projectId]);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateProjectForm(values);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    setSaving(true);
    setError("");
    try {
      await updateProject(ownerId, activeWorkspaceId, projectId, {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        type: values.type || "other",
        clientName: values.clientName.trim() || undefined,
        startDate: values.startDate || undefined,
        deadline: values.deadline || undefined,
        budget: values.budget ? Number(values.budget) : undefined,
        currency: values.currency,
      });
      router.push(`/projects/${projectId}`);
    } catch {
      setError("Unable to save project changes. Please try again.");
      setSaving(false);
    }
  };

  if (loading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading project…</div>;
  if (!project) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold">Project not found</h1><p className="mt-2 text-sm text-muted-foreground">{error || "This project is not available in this browser."}</p><Button asChild variant="outline" className="mt-5"><Link href="/projects">Back to projects</Link></Button></section>;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden="true" className="size-4" />Back to project</Link>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">Edit project</h1>
      <p className="mt-2 text-sm text-muted-foreground">Update the project information below.</p>
      <form onSubmit={save} className="mt-7 rounded-xl border border-border bg-white p-5 sm:p-7">
        <ProjectForm values={values} onChange={setValues} errors={errors} includeStatus={false} />
        {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="mt-7 flex flex-col-reverse justify-end gap-3 border-t border-border pt-5 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => router.push(`/projects/${projectId}`)} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </div>
      </form>
    </div>
  );
}
