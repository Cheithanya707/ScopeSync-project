"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteTaskDialog } from "@/components/tasks/DeleteTaskDialog";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import { TaskStatusSelector } from "@/components/tasks/TaskStatusSelector";
import { useProjectPreview } from "@/hooks/useProjectPreview";
import { deleteTask, getTask, updateTaskStatus } from "@/services/tasks/taskStore";
import { getScopeChanges } from "@/services/changes/changeStore";
import { getProjectMembers } from "@/services/people/memberStore";
import { getRequirement } from "@/services/requirements/requirementStore";
import type { Requirement, ScopeChange, Task, WorkspaceMember } from "@/types";

export default function TaskDetailPage() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const router = useRouter();
  const { project, loading: projectLoading, error: projectError, ownerId, currentUser } = useProjectPreview(projectId);
  const [task, setTask] = useState<Task | null>(null);
  const [assignedMember, setAssignedMember] = useState<WorkspaceMember | null>(null);
  const [relatedChanges, setRelatedChanges] = useState<ScopeChange[]>([]);
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [relatedChangesError, setRelatedChangesError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!project) return;
    let current = true;
    void Promise.resolve().then(() => {
      if (current) setLoading(true);
      return getTask(ownerId, project, decodeURIComponent(taskId));
    }).then((item) => {
      if (current) setTask(item);
      if (item?.requirementId) {
        void getRequirement(ownerId, project, item.requirementId).then((linkedRequirement) => {
          if (current) setRequirement(linkedRequirement);
        }).catch(() => {
          if (current) setError("Unable to load the linked requirement.");
        });
      } else {
        setRequirement(null);
      }
      if (item?.assigneeId) {
        void getProjectMembers(ownerId, project.workspaceId, project.id).then((members) => {
          if (current) setAssignedMember(members.find((member) => member.id === item.assigneeId || member.userId === item.assigneeId) ?? null);
        }).catch(() => {
          if (current) setError("Unable to load the assigned person. Please try again.");
        });
      }
    }).catch(() => {
      if (current) setError("Unable to load this task. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    void getScopeChanges(ownerId, project).then((changes) => {
      if (current) setRelatedChanges(changes.filter((change) => change.affectedTaskIds.includes(decodeURIComponent(taskId))));
    }).catch(() => {
      if (current) setRelatedChangesError(true);
    });
    return () => { current = false; };
  }, [project, ownerId, taskId]);

  const statusChange = async (status: Task["status"]) => {
    if (!project || !task) return;
    setUpdating(true);
    setError("");
    setFeedback("");
    try {
      setTask(await updateTaskStatus(ownerId, project, task.id, status));
      setFeedback(status === "completed" ? "Task marked complete." : "Task status updated.");
    } catch {
      setError("Unable to update task status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const remove = async () => {
    if (!project || !task) return;
    setDeleting(true);
    setError("");
    try {
      await deleteTask(ownerId, project, task.id);
      router.replace(`/projects/${project.id}/tasks`);
    } catch {
      setError("Unable to delete the task. Please try again.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (projectLoading || loading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading task…</div>;
  if (!project || !task) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold text-slate-950">{error || projectError ? "Task unavailable" : "Task not found"}</h1><p className="mt-2 text-sm text-muted-foreground">{error || projectError || "This task is not available in this project."}</p><Button asChild variant="outline" className="mt-5"><Link href={`/projects/${projectId}/tasks`}>Back to tasks</Link></Button></section>;

  return (
    <div>
      <Link href={`/projects/${project.id}/tasks`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden={true} className="size-4" />{project.name} tasks</Link>
      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold text-slate-500">{task.id}</p><h1 className="mt-1 break-words text-3xl font-semibold tracking-tight text-slate-950">{task.title}</h1></div>
        <div className="flex flex-wrap items-center gap-2">
          <TaskStatusSelector value={task.status} onChange={(status) => void statusChange(status)} disabled={updating} />
          {task.status !== "completed" && <Button type="button" variant="outline" onClick={() => void statusChange("completed")} disabled={updating}><Check aria-hidden={true} />Mark Complete</Button>}
          <Button asChild variant="outline"><Link href={`/projects/${project.id}/tasks/${encodeURIComponent(task.id)}/edit`}><Pencil aria-hidden={true} />Edit</Link></Button>
          <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}><Trash2 aria-hidden={true} />Delete</Button>
        </div>
      </div>
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {feedback && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{feedback}</p>}
      <div className="mt-7"><TaskDetail task={task} projectId={project.id} projectDeadline={project.deadline} requirementLabel={requirement ? `${requirement.code} — ${requirement.title}` : task.requirementId ?? "Requirement not available"} currentUserId={currentUser?.uid ?? ownerId} assignedMember={assignedMember} /></div>
      <section aria-labelledby="related-changes-heading" className="mt-6 rounded-xl border border-border bg-white p-5 sm:p-6">
        <h2 id="related-changes-heading" className="text-lg font-semibold text-slate-950">Related change requests</h2>
        {relatedChangesError ? <p role="alert" className="mt-3 text-sm text-red-700">Unable to load related changes.</p> : relatedChanges.length ? <ul className="mt-3 space-y-2">{relatedChanges.map((change) => <li key={change.id} className="rounded-lg border border-border p-3"><Link href={`/projects/${project.id}/changes/${encodeURIComponent(change.id)}`} className="text-sm font-medium text-brand hover:underline">{`CHANGE-${String(change.changeNumber).padStart(3, "0")} — ${change.title}`}</Link></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No change requests are linked to this task.</p>}
      </section>
      <DeleteTaskDialog open={confirmDelete} loading={deleting} onCancel={() => setConfirmDelete(false)} onConfirm={() => void remove()} />
    </div>
  );
}
