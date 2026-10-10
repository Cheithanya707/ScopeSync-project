"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChangeForm, emptyChangeForm, type ChangeFormErrors } from "@/components/changes/ChangeForm";
import { useProjectPreview } from "@/hooks/useProjectPreview";
import { getScopeChange, updateScopeChange } from "@/services/changes/changeStore";
import { getTasks } from "@/services/tasks/taskStore";
import type { ScopeChangeFormValues, Task } from "@/types";
import { useProjectRequirements } from "@/hooks/useProjectRequirements";
import type { ChangeRequirementOption } from "@/components/changes/ChangeRequirementSelector";

function validate(values: ScopeChangeFormValues): ChangeFormErrors {
  const errors: ChangeFormErrors = {};
  if (values.title.trim().length < 3) errors.title = "Title must be at least 3 characters.";
  else if (values.title.trim().length > 200) errors.title = "Title must be 200 characters or fewer.";
  if (!values.description.trim()) errors.description = "Description is required.";
  else if (values.description.trim().length > 5000) errors.description = "Description must be 5000 characters or fewer.";
  const date = new Date(`${values.requestedDate}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.requestedDate) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== values.requestedDate) errors.requestedDate = "Enter a valid requested date.";
  return errors;
}

export default function EditScopeChangePage() {
  const { projectId, changeId } = useParams<{ projectId: string; changeId: string }>();
  const router = useRouter();
  const { project, loading: projectLoading, error: projectError, ownerId } = useProjectPreview(projectId);
  const requirementState = useProjectRequirements(project, ownerId);
  const requirementOptions: ChangeRequirementOption[] = requirementState.requirements.map(({ id, code, title }) => ({ id, code, title }));
  const [values, setValues] = useState<ScopeChangeFormValues>(emptyChangeForm);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<ChangeFormErrors>({});
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!project) return;
    let current = true;
    void Promise.all([getScopeChange(ownerId, project, changeId), getTasks(ownerId, project)]).then(([change, taskList]) => {
      if (!current) return;
      setMissing(!change);
      setTasks(taskList);
      if (change) setValues({
        title: change.title,
        description: change.description ?? "",
        type: change.type,
        priority: change.priority,
        source: change.source,
        affectedRequirementIds: change.affectedRequirementIds,
        affectedTaskIds: change.affectedTaskIds,
        requestedDate: change.requestedDate ?? new Date().toLocaleDateString("en-CA"),
      });
    }).catch(() => {
      if (current) setError("Unable to load this change request. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [project, ownerId, changeId]);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate(values);
    setErrors(validation);
    if (Object.keys(validation).length || !project) return;
    setSaving(true);
    setError("");
    try {
      await updateScopeChange(ownerId, project, changeId, values);
      router.push(`/projects/${project.id}/changes/${changeId}`);
    } catch {
      setError("Unable to save changes. Only new or under-review requests can be edited.");
      setSaving(false);
    }
  };

  if (projectLoading || loading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading change request…</div>;
  if (!project || missing) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold">{projectError || error ? "Change request unavailable" : "Change request not found"}</h1><p className="mt-2 text-sm text-muted-foreground">{projectError || error || "This change request is not available in this project."}</p><Button asChild variant="outline" className="mt-5"><Link href={`/projects/${projectId}/changes`}>Back to changes</Link></Button></section>;

  return <div className="mx-auto max-w-3xl"><Link href={`/projects/${project.id}/changes/${changeId}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden={true} className="size-4" />Back to change</Link><h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">Edit change request</h1><form onSubmit={save} className="mt-7 rounded-xl border border-border bg-white p-5 sm:p-7"><ChangeForm value={values} onChange={setValues} errors={errors} requirements={requirementOptions} tasks={tasks} />{requirementState.error && <p role="status" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{requirementState.error} Existing requirement links are preserved, but new links are unavailable.</p>}{error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}<div className="mt-7 flex flex-col-reverse justify-end gap-3 border-t border-border pt-5 sm:flex-row"><Button asChild type="button" variant="outline"><Link href={`/projects/${project.id}/changes/${changeId}`}>Cancel</Link></Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button></div></form></div>;
}
