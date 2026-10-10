"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareForm } from "@/components/sharing/ShareForm";
import { ShareLinkCard } from "@/components/sharing/ShareLinkCard";
import { ShareTable } from "@/components/sharing/ShareTable";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { getProject } from "@/services/projects/projectStore";
import {
  createProjectShare,
  getProjectShares,
  restoreProjectShare,
  revokeProjectShare,
  updateProjectShare,
} from "@/services/local/projectShareService";
import type { Project, ProjectShare, ProjectSharePermissions, ProjectShareRole } from "@/types";

export function ProjectSharing({ mode }: { mode: "list" | "new" }) {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const workspace = useWorkspace();
  const router = useRouter();
  const ownerId = user?.uid ?? "local-preview-user";
  const activeWorkspaceId = workspace.workspaceId ?? ownerId;
  const [project, setProject] = useState<Project | null>(null);
  const [shares, setShares] = useState<ProjectShare[]>([]);
  const [created, setCreated] = useState<ProjectShare | null>(null);
  const [restored, setRestored] = useState<ProjectShare | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<ProjectShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const found = await getProject(ownerId, activeWorkspaceId, projectId);
      if (!found) {
        setProject(null);
        setShares([]);
        return;
      }
      setProject(found);
      if (mode === "list") setShares(await getProjectShares(found.id, found.workspaceId, ownerId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Client access could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId, mode, ownerId, projectId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const create = async (data: { email: string; displayName: string; role: ProjectShareRole; permissions: ProjectSharePermissions }) => {
    if (!project) throw new Error("Project not found.");
    const share = await createProjectShare({ ...data, projectId: project.id, workspaceId: project.workspaceId }, ownerId);
    setCreated(share);
  };

  const save = async (shareId: string, data: { displayName: string; role: ProjectShareRole; permissions: ProjectSharePermissions }) => {
    setBusyId(shareId);
    setError("");
    try {
      await updateProjectShare(shareId, data, ownerId);
      setEditing(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Access settings could not be updated.");
    } finally {
      setBusyId("");
    }
  };

  const changeStatus = async (share: ProjectShare) => {
    setBusyId(share.id);
    setError("");
    try {
      const updated = share.status === "revoked"
        ? await restoreProjectShare(share.id, ownerId)
        : await revokeProjectShare(share.id, ownerId);
      setShares((current) => current.map((item) => item.id === share.id ? updated : item));
      setRestored(updated.status === "active" ? updated : null);
      setConfirming(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Access status could not be changed.");
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading client access…</div>;
  if (!project) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold text-slate-950">Project unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error || "This project could not be found in the current browser preview."}</p><Button asChild variant="outline" className="mt-5"><Link href="/projects">Back to projects</Link></Button></section>;

  return <div className="mx-auto max-w-5xl">
    <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-950"><ArrowLeft aria-hidden="true" className="size-4" />Back to project</Link>
    <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><div className="flex items-center gap-2 text-sm font-medium text-brand"><Shield aria-hidden="true" className="size-4" />Client Access</div><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Control access to {project.name}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Control who can access this project and what they can see.</p></div>
      {mode === "list" && <Button asChild><Link href={`/projects/${project.id}/sharing/new`}><Plus aria-hidden="true" />Share Project</Link></Button>}
    </div>
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

    {mode === "new" ? <div className="mt-6 space-y-5">
      {created ? <>
        <ShareLinkCard token={created.accessToken ?? ""} />
        <div className="flex flex-wrap gap-2"><Button asChild><Link href={`/projects/${project.id}/sharing`}>Done</Link></Button><Button type="button" variant="outline" onClick={() => setCreated(null)}>Create another share</Button></div>
      </> : <>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">Anyone with this link may be able to access the shared project information. Only share it with trusted people.</p>
        <ShareForm projectName={project.name} submitLabel="Create Access" onSave={create} onCancel={() => router.push(`/projects/${project.id}/sharing`)} />
      </>}
    </div> : <div className="mt-6 space-y-5">
      {restored?.accessToken && <ShareLinkCard token={restored.accessToken} />}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      {shares.length === 0 ? <div className="p-8 text-center"><h2 className="font-semibold text-slate-900">No external access yet</h2><p className="mt-2 text-sm text-muted-foreground">Create a share to grant a trusted person limited, read-focused project access.</p><Button asChild className="mt-5"><Link href={`/projects/${project.id}/sharing/new`}><Plus aria-hidden="true" />Share Project</Link></Button></div>
        : <ShareTable
          shares={shares}
          projectName={project.name}
          editing={editing}
          busyId={busyId}
          onEdit={setEditing}
          onStatusChange={setConfirming}
          onSave={(shareId, data) => save(shareId, { displayName: data.displayName, role: data.role, permissions: data.permissions })}
          onCancel={() => setEditing(null)}
        />}
      </div>
    </div>}
    {confirming && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <section role="alertdialog" aria-modal="true" aria-labelledby="share-confirm-title" className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl">
        <h2 id="share-confirm-title" className="text-lg font-semibold text-slate-950">{confirming.status === "revoked" ? "Restore project access?" : `Revoke access for ${confirming.displayName || confirming.email}?`}</h2>
        <p className="mt-2 text-sm text-slate-600">{confirming.status === "revoked" ? "A fresh share token will be generated. The previously shared link will remain invalid." : "They will no longer be able to access this shared project."}</p>
        <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setConfirming(null)}>Cancel</Button><Button type="button" variant={confirming.status === "revoked" ? "default" : "destructive"} disabled={busyId === confirming.id} onClick={() => void changeStatus(confirming)}>{confirming.status === "revoked" ? "Restore" : "Revoke"}</Button></div>
      </section>
    </div>}
  </div>;
}
