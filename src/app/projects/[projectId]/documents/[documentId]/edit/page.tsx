"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { getDocument, updateDocumentMetadata } from "@/services/documents/documentStore";
import { getProject } from "@/services/projects/projectStore";
import type { Project, ProjectDocument } from "@/types";

export default function EditDocumentPage() {
  const { projectId, documentId } = useParams<{ projectId: string; documentId: string }>();
  const { user } = useAuth();
  const workspace = useWorkspace();
  const router = useRouter();
  const ownerId = user?.uid ?? "local-preview-user";
  const activeWorkspaceId = workspace.workspaceId ?? ownerId;
  const [project, setProject] = useState<Project | null>(null);
  const [document, setDocument] = useState<ProjectDocument | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    void (async () => {
      try {
        const currentProject = await getProject(ownerId, activeWorkspaceId, projectId);
        if (!current) return;
        setProject(currentProject);
        const currentDocument = currentProject ? await getDocument(ownerId, currentProject, documentId) : null;
        if (current) {
          setDocument(currentDocument);
          setName(currentDocument?.name ?? "");
          setDescription(currentDocument?.description ?? "");
          setIsShared(currentDocument?.isShared === true);
        }
      } catch {
        if (current) setError("Unable to load this document from this browser.");
      } finally {
        if (current) setLoading(false);
      }
    })();
    return () => { current = false; };
  }, [activeWorkspaceId, documentId, ownerId, projectId]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project || !document) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a document name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateDocumentMetadata(ownerId, project, document.id, { name: trimmedName, description, isShared });
      router.push(`/projects/${project.id}/documents/${encodeURIComponent(document.id)}`);
    } catch {
      setError("Unable to save document details. Check your workspace access and try again.");
      setSaving(false);
    }
  };

  if (loading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading document…</div>;
  if (!project || !document) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold text-slate-950">{error ? "Document unavailable" : "Document not found"}</h1><p className="mt-2 text-sm text-muted-foreground">{error || "This document may have been removed or belongs to another browser profile."}</p><Button asChild variant="outline" className="mt-5"><Link href={project ? `/projects/${project.id}/documents` : "/projects"}>Back to documents</Link></Button></section>;

  return <div>
    <Link href={`/projects/${project.id}/documents/${encodeURIComponent(document.id)}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden={true} className="size-4" />Back to document</Link>
    <div className="mt-5"><ProjectTabs projectId={project.id} active="documents" /></div>
    <div className="mt-6 max-w-2xl"><p className="text-sm text-muted-foreground">{project.name}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Edit document details</h1><form onSubmit={(event) => void save(event)} className="mt-5 space-y-5 rounded-xl border border-border bg-white p-5 sm:p-6">
      <div><label htmlFor="document-name" className="mb-1.5 block text-sm font-medium text-slate-800">Document name <span className="text-red-700">*</span></label><Input id="document-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required disabled={saving} /></div>
      <div><label htmlFor="document-description" className="mb-1.5 block text-sm font-medium text-slate-800">Description</label><textarea id="document-description" rows={5} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} disabled={saving} className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand" /></div>
      <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm"><input type="checkbox" checked={isShared} onChange={(event) => setIsShared(event.target.checked)} disabled={saving} className="mt-0.5 size-4 accent-brand" /><span><span className="block font-medium text-slate-800">Available to client shares</span><span className="mt-1 block text-xs text-muted-foreground">External viewers can see this file only when the share also allows document access.</span></span></label>
      <p className="text-xs text-muted-foreground">The original filename and file contents will not be changed.</p>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="flex flex-col-reverse justify-end gap-2 border-t border-border pt-4 sm:flex-row"><Button type="button" variant="outline" asChild disabled={saving}><Link href={`/projects/${project.id}/documents/${encodeURIComponent(document.id)}`}>Cancel</Link></Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button></div>
    </form></div>
  </div>;
}
