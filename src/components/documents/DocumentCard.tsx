"use client";

import Link from "next/link";
import { Download, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentFileIcon } from "@/components/documents/DocumentFileIcon";
import { DocumentTypeBadge } from "@/components/documents/DocumentTypeBadge";
import { formatFileSize } from "@/lib/utils/fileUtils";
import { formatDateOnly } from "@/lib/dates";
import type { ProjectDocument } from "@/types";

export function DocumentCard({
  document,
  detailHref,
  projectHref,
  projectName,
  canOpen,
  onOpen,
  onDownload,
  onDelete,
}: {
  document: ProjectDocument;
  detailHref: string;
  projectHref?: string;
  projectName?: string;
  canOpen: boolean;
  onOpen: (document: ProjectDocument) => void;
  onDownload: (document: ProjectDocument) => void;
  onDelete: (document: ProjectDocument) => void;
}) {
  return <article className="rounded-xl border border-border bg-white p-4 shadow-sm">
    <div className="flex items-start gap-3"><DocumentFileIcon type={document.fileType} /><div className="min-w-0 flex-1"><Link href={detailHref} className="block break-words font-semibold text-slate-950 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">{document.name}</Link><p className="mt-1 truncate text-xs text-muted-foreground">{document.originalName}</p></div></div>
    <div className="mt-3 flex flex-wrap items-center gap-2"><DocumentTypeBadge type={document.fileType} /><span className="text-xs text-slate-600">{formatFileSize(document.size)}</span></div>
    <p className="mt-3 text-xs text-muted-foreground">Uploaded {formatDateOnly(document.createdAt)}</p>
    {projectHref && <Link href={projectHref} className="mt-1 block truncate text-xs font-medium text-brand hover:underline">{projectName ?? "View project documents"}</Link>}
    <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
      {canOpen && <Button type="button" variant="outline" size="sm" onClick={() => onOpen(document)}><ExternalLink aria-hidden={true} />Open</Button>}
      <Button type="button" variant="outline" size="sm" onClick={() => onDownload(document)} aria-label={`Download ${document.name}`}><Download aria-hidden={true} />Download</Button>
      <Button asChild type="button" variant="ghost" size="sm"><Link href={`${detailHref}/edit`} aria-label={`Edit ${document.name}`}><Pencil aria-hidden={true} />Edit</Link></Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(document)} aria-label={`Delete ${document.name}`}><Trash2 aria-hidden={true} />Delete</Button>
    </div>
  </article>;
}
