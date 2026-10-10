"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteDocumentDialog } from "@/components/documents/DeleteDocumentDialog";
import { DocumentDetails } from "@/components/documents/DocumentDetails";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { downloadProjectDocument, openProjectDocument } from "@/lib/documents";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { deleteDocument, getDocument } from "@/services/documents/documentStore";
import { getProject } from "@/services/projects/projectStore";
import type { Project, ProjectDocument } from "@/types";

export default function DocumentDetailsPage() {
  const { projectId, documentId } = useParams<{ projectId: string; documentId: string }>();
  const { user } = useAuth();
  const workspace = useWorkspace();
  const router = useRouter();
  const ownerId = user?.uid ?? "local-preview-user";
  const activeWorkspaceId = workspace.workspaceId ?? ownerId;
  const [project, setProject] = useState<Project | null>(null);
  const [document, setDocument] = useState<ProjectDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let current = true;
    void (async () => {
      try {
        const currentProject = await getProject(ownerId, activeWorkspaceId, projectId);
        if (!current) return;
        setProject(currentProject);
        if (currentProject) setDocument(await getDocument(ownerId, currentProject, documentId));
      } catch {
        if (current) setError("Unable to load this document from this browser.");
      } finally {
        if (current) setLoading(false);
      }
    })();
    return () => { current = false; };
  }, [activeWorkspaceId, documentId, ownerId, projectId]);

  const withFile = async (action: "open" | "download") => {
    if (!project || !document) return;
    setActionError("");
    try {
      if (action === "open") await openProjectDocument(ownerId, project, document);
      else await downloadProjectDocument(ownerId, project, document);
    } catch {
      setActionError("Unable to open or download this file from this browser. Please try again.");
    }
  };

  const remove = async () => {
    if (!project || !document) return;
    setDeleting(true);
    setActionError("");
    try {
      await deleteDocument(ownerId, project, document.id);
      router.replace(`/projects/${project.id}/documents`);
    } catch {
      setActionError("Unable to delete this document from this browser. Please try again.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading document…</div>;
  if (!project || !document) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold text-slate-950">{error ? "Document unavailable" : "Document not found"}</h1><p className="mt-2 text-sm text-muted-foreground">{error || "This document may have been removed or belongs to another browser profile."}</p><Button asChild variant="outline" className="mt-5"><Link href={project ? `/projects/${project.id}/documents` : "/projects"}>Back to documents</Link></Button></section>;

  const canOpen = ["pdf", "image", "text"].includes(document.fileType);
  return <div>
    <Link href={`/projects/${project.id}/documents`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden="true" className="size-4" />Back to documents</Link>
    <div className="mt-5"><ProjectTabs projectId={project.id} active="documents" /></div>
    {actionError && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{actionError}</p>}
    <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-sm text-muted-foreground">{project.name}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Document details</h1></div><div className="flex flex-wrap gap-2">{canOpen && <Button type="button" variant="outline" onClick={() => void withFile("open")}><ExternalLink aria-hidden={true} />Open</Button>}<Button type="button" variant="outline" onClick={() => void withFile("download")}><Download aria-hidden={true} />Download</Button><Button asChild variant="outline"><Link href={`/projects/${project.id}/documents/${encodeURIComponent(document.id)}/edit`}><Pencil aria-hidden={true} />Edit</Link></Button><Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>Delete</Button></div></div>
    <div className="mt-6"><DocumentDetails document={document} projectName={project.name} /></div>
    <DeleteDocumentDialog open={confirmDelete} busy={deleting} name={document.name} onCancel={() => setConfirmDelete(false)} onConfirm={() => void remove()} />
  </div>;
}
