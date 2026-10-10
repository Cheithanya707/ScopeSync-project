"use client";

import { useRef, useState } from "react";
import { FileUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DOCUMENT_ACCEPTED_EXTENSIONS } from "@/lib/constants/documents";
import { formatFileSize, getDocumentFileType, getDocumentTypeLabel, validateDocumentFile } from "@/lib/utils/fileUtils";
import { DocumentUploadProgress } from "@/components/documents/DocumentUploadProgress";
import type { Project } from "@/types";

export function DocumentUploadDialog({
  open,
  busy,
  progress,
  projects = [],
  selectedProjectId = "",
  onProjectChange,
  onClose,
  onUpload,
  workspace = false,
}: {
  open: boolean;
  busy: boolean;
  progress: number;
  projects?: Project[];
  selectedProjectId?: string;
  onProjectChange?: (projectId: string) => void;
  workspace?: boolean;
  onClose: () => void;
  onUpload: (file: File, description: string, projectId?: string) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  if (!open) return null;
  const select = (selected?: File) => {
    if (!selected) return;
    const validation = validateDocumentFile(selected);
    setFile(validation ? null : selected);
    setError(validation ?? "");
  };
  const close = () => {
    if (busy) return;
    setFile(null);
    setDescription("");
    setError("");
    onClose();
  };
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError("Choose a supported file to upload.");
      return;
    }
    setError("");
    try {
      await onUpload(file, description, selectedProjectId);
      setFile(null);
      setDescription("");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload this file. Please try again.");
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-3 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }} onKeyDown={(event) => { if (event.key === "Escape" && !busy) close(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="document-upload-title" className="my-auto w-full max-w-lg rounded-2xl border border-border bg-white p-5 shadow-xl sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><h2 id="document-upload-title" className="text-xl font-semibold text-slate-950">Upload Document</h2><p className="mt-1 text-sm text-muted-foreground">{workspace ? "Add a file to one of your projects." : "Add a file to this project."}</p></div><Button type="button" variant="ghost" size="icon" aria-label="Close upload dialog" onClick={close} disabled={busy}><X aria-hidden={true} /></Button></div>
      <form onSubmit={submit} className="mt-5 space-y-4">
        {workspace && <div><label htmlFor="document-upload-project" className="mb-1.5 block text-sm font-medium text-slate-800">Project <span className="text-red-700">*</span></label><select id="document-upload-project" className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" value={selectedProjectId} onChange={(event) => onProjectChange?.(event.target.value)} required disabled={busy}><option value="">Choose a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>}
        <div><label htmlFor="document-file" className="mb-1.5 block text-sm font-medium text-slate-800">Choose file <span className="text-red-700">*</span></label><Input ref={inputRef} id="document-file" type="file" accept={DOCUMENT_ACCEPTED_EXTENSIONS} onChange={(event) => select(event.target.files?.[0])} disabled={busy} aria-describedby="document-file-help" /><p id="document-file-help" className="mt-1.5 text-xs text-muted-foreground">PDF, Word, Excel, PowerPoint, images, text/CSV, ZIP · Maximum 50 MB</p></div>
        {file && <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-slate-50 p-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{file.name}</p><p className="mt-1 text-xs text-slate-600">{getDocumentTypeLabel(getDocumentFileType(file))} · {formatFileSize(file.size)}</p></div><FileUp aria-hidden={true} className="size-5 shrink-0 text-slate-500" /></div>}
        <div><label htmlFor="document-description" className="mb-1.5 block text-sm font-medium text-slate-800">Description <span className="font-normal text-slate-500">(optional)</span></label><textarea id="document-description" rows={3} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand" /></div>
        {busy && <DocumentUploadProgress progress={progress} fileName={file?.name ?? "file"} />}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="flex flex-col-reverse justify-end gap-2 border-t border-border pt-4 sm:flex-row"><Button type="button" variant="outline" onClick={close} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Uploading..." : "Upload Document"}</Button></div>
      </form>
    </section>
  </div>;
}
