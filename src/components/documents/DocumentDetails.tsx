import { DocumentFileIcon } from "@/components/documents/DocumentFileIcon";
import { DocumentTypeBadge } from "@/components/documents/DocumentTypeBadge";
import { formatDateTime } from "@/lib/dates";
import { formatFileSize } from "@/lib/utils/fileUtils";
import type { ProjectDocument } from "@/types";

export function DocumentDetails({ document, projectName }: { document: ProjectDocument; projectName: string }) {
  const details = [
    ["Original filename", document.originalName],
    ["File type", null],
    ["File size", formatFileSize(document.size)],
    ["Project", projectName],
    ["Uploaded by", document.uploadedBy],
    ["Uploaded", formatDateTime(document.createdAt)],
    ["Last updated", formatDateTime(document.updatedAt)],
  ];
  return <section className="rounded-xl border border-border bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><DocumentFileIcon type={document.fileType} /><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{document.id}</p><h2 className="mt-1 break-words text-lg font-semibold text-slate-950">{document.name}</h2></div></div><dl className="mt-5 divide-y divide-border border-t border-border">{details.map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium text-slate-800">{label === "File type" ? <DocumentTypeBadge type={document.fileType} /> : value}</dd></div>)}</dl><div className="mt-3 border-t border-border pt-4"><h3 className="text-sm font-medium text-slate-800">Description</h3><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{document.description || "No description provided."}</p></div></section>;
}
