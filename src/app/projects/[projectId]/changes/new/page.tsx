"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChangeForm, emptyChangeForm, type ChangeFormErrors } from "@/components/changes/ChangeForm";
import { useProjectPreview } from "@/hooks/useProjectPreview";
import { createScopeChange } from "@/services/changes/changeStore";
import { getTasks } from "@/services/tasks/taskStore";
import type { ScopeChangeFormValues, Task } from "@/types";
import { useProjectRequirements } from "@/hooks/useProjectRequirements";
import type { ChangeRequirementOption } from "@/components/changes/ChangeRequirementSelector";

function validate(values: ScopeChangeFormValues): ChangeFormErrors {
  const errors: ChangeFormErrors = {};
  const title = values.title.trim();
  const description = values.description.trim();
  if (title.length < 3) errors.title = "Title must be at least 3 characters.";
  else if (title.length > 200) errors.title = "Title must be 200 characters or fewer.";
  if (!description) errors.description = "Description is required.";
  else if (description.length > 5000) errors.description = "Description must be 5000 characters or fewer.";
  const date = new Date(`${values.requestedDate}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.requestedDate) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== values.requestedDate) errors.requestedDate = "Enter a valid requested date.";
  return errors;
}

export default function NewChangePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { project, loading, error: projectError, ownerId } = useProjectPreview(projectId);
  const requirementState = useProjectRequirements(project, ownerId);
  const requirementOptions: ChangeRequirementOption[] = requirementState.requirements.map(({ id, code, title }) => ({ id, code, title }));
  const [values, setValues] = useState<ScopeChangeFormValues>(emptyChangeForm);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [errors, setErrors] = useState<ChangeFormErrors>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTasks = async () => {
    if (!project || tasksLoaded || tasksLoading) return;
    setTasksLoading(true);
    try {
      setTasks(await getTasks(ownerId, project));
      setTasksLoaded(true);
    } catch {
      setError("Unable to load project tasks. Please try again.");
    } finally {
      setTasksLoading(false);
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate(values);
    setErrors(validation);
    if (Object.keys(validation).length || !project) return;
    setSaving(true);
    setError("");
    try {
      const change = await createScopeChange(ownerId, project, values);
      router.push(`/projects/${project.id}/changes/${change.id}`);
    } catch {
      setError("Unable to create this change request. Please try again.");
      setSaving(false);
    }
  };

  if (loading || tasksLoading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading project information…</div>;
  if (!project) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold">{projectError ? "Project unavailable" : "Project not found"}</h1><p className="mt-2 text-sm text-muted-foreground">{projectError || "This project is not available in this browser."}</p><Button asChild variant="outline" className="mt-5"><Link href="/projects">Back to projects</Link></Button></section>;
  return <div className="mx-auto max-w-3xl">
    <Link href={`/projects/${project.id}/changes`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden={true} className="size-4" />Back to changes</Link>
    <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">Add Change Request</h1><p className="mt-2 text-sm text-muted-foreground">Record a request that may affect {project.name}&apos;s agreed scope.</p>
    <form onSubmit={submit} onFocusCapture={() => void loadTasks()} className="mt-7 rounded-xl border border-border bg-white p-5 sm:p-7">
      <ChangeForm value={values} onChange={setValues} errors={errors} requirements={requirementOptions} tasks={tasks} />
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {requirementState.error && <p role="status" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{requirementState.error} You can still record this request without linking a requirement.</p>}
      <div className="mt-7 flex flex-col-reverse justify-end gap-3 border-t border-border pt-5 sm:flex-row"><Button asChild type="button" variant="outline"><Link href={`/projects/${project.id}/changes`}>Cancel</Link></Button><Button type="submit" disabled={saving}>{saving ? "Creating request..." : "Create Change Request"}</Button></div>
    </form>
    <p className="mt-4 text-xs text-muted-foreground">New requests do not modify requirements or tasks. AI analysis will be available in a future step.</p>
  </div>;
}
