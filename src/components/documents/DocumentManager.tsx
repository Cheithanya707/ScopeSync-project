"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentEmptyState } from "@/components/documents/DocumentEmptyState";
import { DocumentFilters } from "@/components/documents/DocumentFilters";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentSearch } from "@/components/documents/DocumentSearch";
import { DocumentUploadDialog } from "@/components/documents/DocumentUploadDialog";
import { DeleteDocumentDialog } from "@/components/documents/DeleteDocumentDialog";
import { sanitizeStorageFileName, validateDocumentFile, getDocumentFileType } from "@/lib/utils/fileUtils";
import type { DocumentSort } from "@/lib/constants/documents";
import { downloadProjectDocument, openProjectDocument } from "@/lib/documents";
import { getProjectDocuments, getWorkspaceDocuments, saveDocument, deleteDocument } from "@/services/documents/documentStore";
import { getProjects } from "@/services/projects/projectStore";
import { useWorkspace } from "@/context/WorkspaceContext";
import type { DocumentFileType, Project, ProjectDocument } from "@/types";

export function DocumentManager({ ownerId, project }: { ownerId: string; project?: Project }) {
  const workspaceContext = useWorkspace();
  const workspace = !project;
  const [projects, setProjects] = useState<Project[]>(project ? [project] : []);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [query, setQuery] = useState("");
  const [fileType, setFileType] = useState<DocumentFileType | "all">("all");
  const [projectId, setProjectId] = useState("all");
  const [sort, setSort] = useState<DocumentSort>("newest");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadProjectId, setUploadProjectId] = useState(project?.id ?? "");
  const [deleting, setDeleting] = useState<ProjectDocument | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const projectList = workspace
        ? await getProjects(ownerId, workspaceContext.workspaceId ?? ownerId)
        : project ? [project] : [];
      const items = workspace
        ? await getWorkspaceDocuments(ownerId, workspaceContext.workspaceId ?? ownerId, projectList)
        : project ? await getProjectDocuments(ownerId, project) : [];
      setProjects(projectList);
      setDocuments(items);
    } catch {
      setError("Unable to load documents. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [ownerId, project, workspace, workspaceContext.workspaceId]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const projectNameById = useMemo(() => new Map(projects.map((item) => [item.id, item.name])), [projects]);
  const filteredDocuments = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return documents.filter((document) => {
      const matchesType = fileType === "all" || document.fileType === fileType;
      const matchesProject = !workspace || projectId === "all" || document.projectId === projectId;
      const matchesSearch = !term || `${document.name} ${document.originalName} ${document.description ?? ""} ${projectNameById.get(document.projectId) ?? ""}`.toLocaleLowerCase().includes(term);
      return matchesType && matchesProject && matchesSearch;
    }).sort((a, b) => {
      switch (sort) {
        case "oldest": return a.createdAt.localeCompare(b.createdAt);
        case "name_asc": return a.name.localeCompare(b.name);
        case "name_desc": return b.name.localeCompare(a.name);
        case "largest": return b.size - a.size;
        case "smallest": return a.size - b.size;
        default: return b.createdAt.localeCompare(a.createdAt);
      }
    });
  }, [documents, fileType, projectId, projectNameById, query, sort, workspace]);

  const upload = async (file: File, description: string, selectedProjectId?: string) => {
    const targetProject = projects.find((item) => item.id === (workspace ? selectedProjectId : project?.id));
    if (!targetProject) throw new Error("Choose a valid project before uploading.");
    const validation = validateDocumentFile(file);
    if (validation) throw new Error(validation);
    setUploading(true);
    setProgress(0);
    setActionError("");
    const interval = window.setInterval(() => setProgress((current) => Math.min(current + 7, 92)), 160);
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const document: ProjectDocument = {
        id,
        workspaceId: targetProject.workspaceId,
        projectId: targetProject.id,
        ownerId,
        name: file.name,
        originalName: file.name,
        storagePath: `workspaces/${targetProject.workspaceId}/projects/${targetProject.id}/documents/${id}/${sanitizeStorageFileName(file.name)}`,
        mimeType: file.type || "application/octet-stream",
        fileType: getDocumentFileType(file),
        size: file.size,
        uploadedBy: "You",
        description: description.trim() || undefined,
        isShared: false,
        createdAt: now,
        updatedAt: now,
      };
      await saveDocument(ownerId, targetProject, document, file);
      window.clearInterval(interval);
      setProgress(100);
      await load();
      setUploadOpen(false);
    } catch {
      window.clearInterval(interval);
      throw new Error("Unable to save this document in browser storage. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const withFile = async (document: ProjectDocument, action: "open" | "download") => {
    const sourceProject = projects.find((item) => item.id === document.projectId);
    if (!sourceProject) {
      setActionError("The project for this document is not available.");
      return;
    }
    setActionError("");
    try {
      if (action === "open") await openProjectDocument(ownerId, sourceProject, document);
      else await downloadProjectDocument(ownerId, sourceProject, document);
    } catch {
      setActionError("Unable to open or download this file from this browser. Please try again.");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const sourceProject = projects.find((item) => item.id === deleting.projectId);
    if (!sourceProject) {
      setActionError("The project for this document is not available.");
      return;
    }
    setDeleteBusy(true);
    setActionError("");
    try {
      await deleteDocument(ownerId, sourceProject, deleting.id);
      setDeleting(null);
      setDeleteSuccess(true);
      await load();
    } catch {
      setActionError("Unable to delete this document from browser storage. Please try again.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const noProjects = workspace && !loading && projects.length === 0;
  const title = workspace ? "Documents" : "Documents";
  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-brand">{workspace ? "Workspace" : project?.name}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{workspace ? "Find and manage files across your projects." : "Keep project files organized and easy to find."}</p></div><Button type="button" onClick={() => { setUploadProjectId(project?.id ?? ""); setUploadOpen(true); }} disabled={noProjects}><FilePlus2 aria-hidden={true} />Upload Document</Button></div>
    <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">Browser preview: documents and file contents are stored only in this browser and are not shared across devices.</p>
    {actionError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{actionError}</p>}
    {deleteSuccess && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Document deleted.</p>}
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {!loading && documents.length > 0 && <section aria-label="Search and filter documents" className="mt-6 grid gap-3 rounded-xl border border-border bg-white p-4 xl:grid-cols-[minmax(220px,1fr)_2fr]"><DocumentSearch value={query} onChange={setQuery} /><DocumentFilters fileType={fileType} projectId={projectId} sort={sort} onFileTypeChange={setFileType} onProjectChange={setProjectId} onSortChange={setSort} projects={projects} workspace={workspace} /></section>}
    {loading ? <div role="status" className="mt-6 rounded-xl border border-border bg-white p-12 text-center text-sm text-muted-foreground">Loading documents…</div> : noProjects ? <div className="mt-6 rounded-xl border border-border bg-white p-10 text-center"><h2 className="font-semibold text-slate-950">No projects yet</h2><p className="mt-2 text-sm text-muted-foreground">Create a project before uploading documents.</p><Button asChild className="mt-4"><Link href="/projects/new">Create Project</Link></Button></div> : documents.length === 0 ? <div className="mt-6"><DocumentEmptyState workspace={workspace} onUpload={() => setUploadOpen(true)} /></div> : filteredDocuments.length === 0 ? <p role="status" className="mt-6 rounded-xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">No documents match your search or filters.</p> : <div className="mt-6"><DocumentList documents={filteredDocuments} projectNameById={projectNameById} workspace={workspace} onOpen={(document) => void withFile(document, "open")} onDownload={(document) => void withFile(document, "download")} onDelete={(document) => { setDeleteSuccess(false); setDeleting(document); }} /></div>}
    <DocumentUploadDialog open={uploadOpen} busy={uploading} progress={progress} projects={projects} selectedProjectId={uploadProjectId} onProjectChange={setUploadProjectId} workspace={workspace} onClose={() => setUploadOpen(false)} onUpload={upload} />
    <DeleteDocumentDialog open={Boolean(deleting)} busy={deleteBusy} name={deleting?.name ?? ""} onCancel={() => setDeleting(null)} onConfirm={() => void confirmDelete()} />
  </div>;
}
