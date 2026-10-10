import { ArrowDownToLine, ArrowUpRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClientDocument } from "@/services/client-view/clientShareData";
import { ClientCard, ClientEmpty, clientHumanize } from "@/components/client-view/ClientViewPrimitives";

export function ClientDocuments({
  documents,
  busyId,
  error,
  onOpen,
  onDownload,
}: {
  documents: ClientDocument[];
  busyId: string;
  error: string;
  onOpen: (id: string) => void;
  onDownload: (id: string) => void;
}) {
  return <ClientCard title="Shared documents" icon={FileText}>{error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}{documents.length === 0 ? <ClientEmpty>No documents have been marked as shared for this project.</ClientEmpty> : <ul className="divide-y divide-border">{documents.map((document) => <li key={document.id} className="flex flex-col justify-between gap-3 py-4 first:pt-0 sm:flex-row sm:items-center"><div className="min-w-0"><p className="truncate font-medium text-slate-900">{document.name}</p><p className="mt-1 text-xs text-muted-foreground">{clientHumanize(document.fileType)} · {Math.max(1, Math.round(document.size / 1024))} KB{document.description ? ` · ${document.description}` : ""}</p></div><div className="flex shrink-0 gap-2"><Button type="button" size="sm" variant="outline" disabled={busyId === document.id} onClick={() => onOpen(document.id)}><ArrowUpRight aria-hidden="true" />Open</Button><Button type="button" size="sm" variant="outline" disabled={busyId === document.id} onClick={() => onDownload(document.id)}><ArrowDownToLine aria-hidden="true" />Download</Button></div></li>)}</ul>}</ClientCard>;
}
