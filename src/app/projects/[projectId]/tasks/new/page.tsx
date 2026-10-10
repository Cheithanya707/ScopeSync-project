"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskForm, emptyTaskForm } from "@/components/tasks/TaskForm";
import { useProjectPreview } from "@/hooks/useProjectPreview";
import { validateTaskForm } from "@/lib/taskValidation";
import { createTask } from "@/services/tasks/taskStore";
import type { TaskFormValues, WorkspaceMember } from "@/types";
import type { TaskFormErrors } from "@/lib/taskValidation";
import { getProjectMembers } from "@/services/people/memberStore";
import { useProjectRequirements } from "@/hooks/useProjectRequirements";
import type { RequirementOption } from "@/components/tasks/TaskRequirementSelector";

export default function NewTaskPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { project, loading, error: projectError, ownerId, currentUser } = useProjectPreview(projectId);
  const [values, setValues] = useState<TaskFormValues>(emptyTaskForm);
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState("");
  const requirementState = useProjectRequirements(project, ownerId);
  const requirementOptions: RequirementOption[] = requirementState.requirements.map(({ id, code, title }) => ({ id, code, title }));

  useEffect(() => {
    if (!project) return;
    let current = true;
    void getProjectMembers(ownerId, project.workspaceId, project.id).then((people) => {
      if (current) setMembers(people);
    }).catch(() => {
      if (current) setMembersError("Unable to load workspace people for task assignment.");
    }).finally(() => {
      if (current) setMembersLoading(false);
    });
    return () => { current = false; };
  }, [ownerId, project]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateTaskForm(values);
    setErrors(validation);
    if (Object.keys(validation).length || !project) return;
    setSaving(true);
    setError("");
    try {
      const task = await createTask(ownerId, project, values);
      router.push(`/projects/${project.id}/tasks/${encodeURIComponent(task.id)}`);
    } catch {
      setError("Unable to create this task. Please try again.");
      setSaving(false);
    }
  };

  if (loading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading project…</div>;
  if (!project) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold text-slate-950">{projectError ? "Project unavailable" : "Project not found"}</h1><p className="mt-2 text-sm text-muted-foreground">{projectError || "This project is not available in this browser."}</p><Button asChild variant="outline" className="mt-5"><Link href="/projects">Back to projects</Link></Button></section>;
  if (membersLoading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading workspace people…</div>;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/projects/${project.id}/tasks`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden={true} className="size-4" />Back to tasks</Link>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">Add task</h1>
      <p className="mt-2 text-sm text-muted-foreground">Create work to help deliver {project.name}.</p>
      <form onSubmit={submit} className="mt-7 rounded-xl border border-border bg-white p-5 sm:p-7">
        <TaskForm value={values} onChange={setValues} projectDeadline={project.deadline} currentUserId={currentUser?.uid ?? ownerId} currentUserLabel={currentUser?.displayName || "Current user (you)"} members={members} requirements={requirementOptions} errors={errors} />
        {membersError && <p role="status" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{membersError} You can still assign this task to yourself.</p>}
        {requirementState.error && <p role="status" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{requirementState.error} You can still create a task without linking a requirement.</p>}
        {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="mt-7 flex flex-col-reverse justify-end gap-3 border-t border-border pt-5 sm:flex-row">
          <Button asChild type="button" variant="outline"><Link href={`/projects/${project.id}/tasks`}>Cancel</Link></Button>
          <Button type="submit" disabled={saving}>{saving ? "Creating task..." : "Create Task"}</Button>
        </div>
      </form>
    </div>
  );
}
