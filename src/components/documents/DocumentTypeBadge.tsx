import { getDocumentTypeLabel } from "@/lib/utils/fileUtils";
import type { DocumentFileType } from "@/types";

export function DocumentTypeBadge({ type }: { type: DocumentFileType }) {
  return <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">{getDocumentTypeLabel(type)}</span>;
}
