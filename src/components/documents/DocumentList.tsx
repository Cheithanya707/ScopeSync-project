"use client";

import Link from "next/link";
import { Download, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentFileIcon } from "@/components/documents/DocumentFileIcon";
import { DocumentTypeBadge } from "@/components/documents/DocumentTypeBadge";
import { formatDateTime } from "@/lib/dates";
import { formatFileSize } from "@/lib/utils/fileUtils";
import type { ProjectDocument } from "@/types";

export function DocumentList({
  documents,
  projectNameById,
  workspace,
  onOpen,
  onDownload,
  onDelete,
}: {
  documents: ProjectDocument[];
  projectNameById: Map<string, string>;
  workspace: boolean;
  onOpen: (document: ProjectDocument) => void;
  onDownload: (document: ProjectDocument) => void;
  onDelete: (document: ProjectDocument) => void;
}) {
  return <>
    <div className="grid gap-3 md:hidden">{documents.map((document) => <DocumentCard key={document.id} document={document} detailHref={`/projects/${document.projectId}/documents/${encodeURIComponent(document.id)}`} projectHref={workspace ? `/projects/${document.projectId}/documents` : undefined} projectName={projectNameById.get(document.projectId)} canOpen={["pdf", "image", "text"].includes(document.fileType)} onOpen={onOpen} onDownload={onDownload} onDelete={onDelete} />)}</div>
    <div className="hidden overflow-hidden rounded-xl border border-border bg-white md:block"><div className="overflow-x-auto"><table className="w-full min-w-[850px] border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500"><tr>{(workspace ? ["Document", "Project", "Type", "Size", "Uploaded", "Actions"] : ["Document", "Type", "Size", "Uploaded By", "Uploaded", "Actions"]).map((header) => <th key={header} scope="col" className="px-4 py-3">{header}</th>)}</tr></thead><tbody className="divide-y divide-border">{documents.map((document) => {
      const href = `/projects/${document.projectId}/documents/${encodeURIComponent(document.id)}`;
      return <tr key={document.id} className="hover:bg-slate-50/70">
        <td className="max-w-[300px] px-4 py-3"><div className="flex items-center gap-3"><DocumentFileIcon type={document.fileType} className="size-4" /><div className="min-w-0"><Link href={href} className="block truncate font-medium text-slate-900 hover:text-brand">{document.name}</Link><p className="mt-1 truncate text-xs text-muted-foreground">{document.originalName}</p></div></div></td>
        <td className="px-4 py-3">{workspace ? <Link href={`/projects/${document.projectId}/documents`} className="font-medium text-brand hover:underline">{projectNameById.get(document.projectId) ?? "Project"}</Link> : <DocumentTypeBadge type={document.fileType} />}</td>
        {workspace && <td className="px-4 py-3"><DocumentTypeBadge type={document.fileType} /></td>}
        <td className="px-4 py-3 text-slate-700">{formatFileSize(document.size)}</td>
        {!workspace && <td className="px-4 py-3 text-slate-700">{document.uploadedBy}</td>}
        <td className="px-4 py-3 text-slate-700">{formatDateTime(document.createdAt)}</td>
        <td className="px-4 py-3"><div className="flex items-center gap-1">{["pdf", "image", "text"].includes(document.fileType) && <Button type="button" variant="ghost" size="icon-sm" aria-label={`Open ${document.name}`} onClick={() => onOpen(document)}><ExternalLink aria-hidden={true} /></Button>}<Button type="button" variant="ghost" size="icon-sm" aria-label={`Download ${document.name}`} onClick={() => onDownload(document)}><Download aria-hidden={true} /></Button><Button asChild type="button" variant="ghost" size="icon-sm"><Link href={`${href}/edit`} aria-label={`Edit ${document.name}`}><Pencil aria-hidden={true} /></Link></Button><Button type="button" variant="ghost" size="icon-sm" aria-label={`Delete ${document.name}`} onClick={() => onDelete(document)}><Trash2 aria-hidden={true} /></Button></div></td>
      </tr>;
    })}</tbody></table></div></div>
  </>;
}
