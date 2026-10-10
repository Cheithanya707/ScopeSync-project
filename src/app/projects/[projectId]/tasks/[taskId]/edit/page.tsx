"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskForm, emptyTaskForm } from "@/components/tasks/TaskForm";
import { useProjectPreview } from "@/hooks/useProjectPreview";
import { validateTaskForm, type TaskFormErrors } from "@/lib/taskValidation";
import { getTask, updateTask } from "@/services/tasks/taskStore";
import { getProjectMembers } from "@/services/people/memberStore";
import type { Task, TaskFormValues, WorkspaceMember } from "@/types";
import { useProjectRequirements } from "@/hooks/useProjectRequirements";
import type { RequirementOption } from "@/components/tasks/TaskRequirementSelector";

export default function EditTaskPage() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const router = useRouter();
  const { project, loading: projectLoading, error: projectError, ownerId, currentUser } = useProjectPreview(projectId);
  const [task, setTask] = useState<Task | null>(null);
  const [values, setValues] = useState<TaskFormValues>(emptyTaskForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<TaskFormErrors>({});
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

  useEffect(() => {
    if (!project) return;
    let current = true;
    void Promise.resolve().then(() => getTask(ownerId, project, decodeURIComponent(taskId))).then((item) => {
      if (!current) return;
      setTask(item);
      if (item) setValues({
        title: item.title, description: item.description ?? "", type: item.type, priority: item.priority,
        status: item.status, requirementId: item.requirementId ?? "", assigneeId: item.assigneeId ?? "",
        dueDate: item.dueDate ?? "", estimatedHours: item.estimatedHours == null ? "" : String(item.estimatedHours),
        actualHours: item.actualHours == null ? "" : String(item.actualHours),
      });
    }).catch(() => {
      if (current) setError("Unable to load this task. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [project, ownerId, taskId]);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateTaskForm(values);
    setErrors(validation);
    if (Object.keys(validation).length || !project || !task) return;
    setSaving(true);
    setError("");
    try {
      await updateTask(ownerId, project, task.id, values);
      router.push(`/projects/${project.id}/tasks/${encodeURIComponent(task.id)}`);
    } catch {
      setError("Unable to save task changes. Please try again.");
      setSaving(false);
    }
  };

  if (projectLoading || loading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading task…</div>;
  if (!project || !task) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold text-slate-950">{error || projectError ? "Task unavailable" : "Task not found"}</h1><p className="mt-2 text-sm text-muted-foreground">{error || projectError || "This task is not available in this project."}</p><Button asChild variant="outline" className="mt-5"><Link href={`/projects/${projectId}/tasks`}>Back to tasks</Link></Button></section>;
  if (membersLoading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading workspace people…</div>;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/projects/${project.id}/tasks/${encodeURIComponent(task.id)}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden={true} className="size-4" />Back to task</Link>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">Edit task</h1>
      <p className="mt-2 text-sm text-muted-foreground">Update the work details for {task.id}.</p>
      <form onSubmit={save} className="mt-7 rounded-xl border border-border bg-white p-5 sm:p-7">
        <TaskForm value={values} onChange={setValues} projectDeadline={project.deadline} currentUserId={currentUser?.uid ?? ownerId} currentUserLabel={currentUser?.displayName || "Current user (you)"} members={members} requirements={requirementOptions} errors={errors} />
        {membersError && <p role="status" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{membersError} You can still assign this task to yourself.</p>}
        {requirementState.error && <p role="status" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{requirementState.error} You can still save without linking a requirement.</p>}
        {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="mt-7 flex flex-col-reverse justify-end gap-3 border-t border-border pt-5 sm:flex-row">
          <Button asChild type="button" variant="outline"><Link href={`/projects/${project.id}/tasks/${encodeURIComponent(task.id)}`}>Cancel</Link></Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </div>
      </form>
    </div>
  );
}
