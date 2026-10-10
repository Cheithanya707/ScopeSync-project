"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChangeConfirmationDialog } from "@/components/changes/ChangeConfirmationDialog";
import { ChangeDetail } from "@/components/changes/ChangeDetail";
import { ChangeReviewPanel, type ChangeAction } from "@/components/changes/ChangeReviewPanel";
import { changeCode } from "@/lib/changes";
import { useProjectPreview } from "@/hooks/useProjectPreview";
import {
  approveScopeChange,
  deleteScopeChange,
  getScopeChange,
  markChangeImplemented,
  rejectScopeChange,
  startChangeReview,
  updateChangeStatus,
} from "@/services/changes/changeStore";
import { getTasks } from "@/services/tasks/taskStore";
import { getRequirements } from "@/services/requirements/requirementStore";
import type { Requirement, ScopeChange, Task } from "@/types";

export default function ScopeChangeDetailPage() {
  const { projectId, changeId } = useParams<{ projectId: string; changeId: string }>();
  const router = useRouter();
  const { project, loading: projectLoading, error: projectError, ownerId } = useProjectPreview(projectId);
  const [change, setChange] = useState<ScopeChange | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!project) return;
    let current = true;
    void Promise.all([getScopeChange(ownerId, project, changeId), getTasks(ownerId, project), getRequirements(ownerId, project)]).then(([item, taskList, requirementList]) => {
      if (!current) return;
      setChange(item);
      setTasks(taskList);
      setRequirements(requirementList);
      setReviewNotes(item?.reviewNotes ?? "");
    }).catch(() => {
      if (current) setError("Unable to load this change request. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [project, ownerId, changeId]);

  const runAction = async (action: ChangeAction, reason?: string, notes?: string) => {
    if (!project || !change) return;
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      let updated: ScopeChange;
      if (action === "start_review") updated = await startChangeReview(ownerId, project, change.id, notes);
      else if (action === "approve") updated = await approveScopeChange(ownerId, project, change.id, notes);
      else if (action === "reject") updated = await rejectScopeChange(ownerId, project, change.id, reason ?? "", notes);
      else if (action === "implement") updated = await markChangeImplemented(ownerId, project, change.id);
      else if (action === "cancel") updated = await updateChangeStatus(ownerId, project, change.id, "cancelled");
      else return;
      setChange(updated);
      setReviewNotes(updated.reviewNotes ?? "");
      setFeedback(action === "start_review" ? "Review started." : action === "approve" ? "Change request approved." : action === "reject" ? "Change request rejected." : action === "implement" ? "Change marked as implemented." : "Change request cancelled.");
    } catch {
      setError("Unable to update this change request. Please check its status and try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!project || !change) return;
    setBusy(true);
    setError("");
    try {
      await deleteScopeChange(ownerId, project, change.id);
      router.replace(`/projects/${project.id}/changes`);
    } catch {
      setError("Unable to delete this change request. Please try again.");
      setBusy(false);
      setDeleteOpen(false);
    }
  };

  if (projectLoading || loading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading change request…</div>;
  if (!project || !change) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold">{error || projectError ? "Change request unavailable" : "Change request not found"}</h1><p className="mt-2 text-sm text-muted-foreground">{error || projectError || "This change request is not available in this project."}</p><Button asChild variant="outline" className="mt-5"><Link href={`/projects/${projectId}/changes`}>Back to changes</Link></Button></section>;

  return <div>
    <Link href={`/projects/${project.id}/changes`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden={true} className="size-4" />{project.name} changes</Link>
    <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-slate-500">{changeCode(change)}</p><h1 className="mt-1 break-words text-3xl font-semibold tracking-tight text-slate-950">{change.title}</h1></div><div className="flex flex-wrap gap-2">{["new", "under_review"].includes(change.status) && <Button asChild variant="outline"><Link href={`/projects/${project.id}/changes/${change.id}/edit`}><Pencil aria-hidden={true} />Edit</Link></Button>}<Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)} disabled={busy}><Trash2 aria-hidden={true} />Delete</Button></div></div>
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}{feedback && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{feedback}</p>}
    <div className="mt-7 grid gap-6"><ChangeDetail change={change} projectId={project.id} tasks={tasks} requirements={requirements} /><ChangeReviewPanel change={change} busy={busy} onAction={runAction} reviewNotes={reviewNotes} onReviewNotesChange={setReviewNotes} /></div>
    <ChangeConfirmationDialog open={deleteOpen} mode="delete" loading={busy} rejectionReason="" setRejectionReason={() => undefined} onCancel={() => setDeleteOpen(false)} onConfirm={() => void remove()} />
  </div>;
}
